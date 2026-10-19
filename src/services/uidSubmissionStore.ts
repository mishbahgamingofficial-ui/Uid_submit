import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  db,
  auth,
  OperationType,
  handleFirestoreError,
} from '../firebase';
import { normalizeUid } from '../utils/uidValidation';

export const ADMIN_SECRET_UID = '766758';
export const BOOTSTRAPPED_ADMIN_EMAIL = 'mishbahgamingofficial@gmail.com';

// Blueprint-synced validation boundaries
export const BLUEPRINT_CONSTRAINTS = {
  UID_MIN_LENGTH: 6,
  UID_MAX_LENGTH: 24,
  UID_PATTERN: /^[A-Za-z0-9\-_]+$/,
  ACCOUNT_NAME_MAX_LENGTH: 80,
  REVIEW_NOTE_MAX_LENGTH: 240,
  ID_MAX_LENGTH: 128,
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
};

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface UidSubmissionRecord {
  id: string;
  uid: string;
  accountName: string;
  status: VerificationStatus;
  ownerId: string;
  reviewNote: string;
  createdAtIso: string;
  updatedAtIso: string;
}

const LOCAL_STORAGE_KEY = 'jobsly_uid_submissions_v1';

const INITIAL_SEED_SUBMISSIONS: UidSubmissionRecord[] = [
  {
    id: 'sub_84920148',
    uid: 'UID-84920148',
    accountName: 'Nicholas Ergemla',
    status: 'pending',
    ownerId: 'local_user_1',
    reviewNote: '',
    createdAtIso: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'sub_518294012',
    uid: '518294012',
    accountName: 'Amina Vance',
    status: 'verified',
    ownerId: 'local_user_2',
    reviewNote: 'Matched primary player profile ID.',
    createdAtIso: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'sub_90341827',
    uid: 'UID-90341827',
    accountName: 'Kaito Takahashi',
    status: 'pending',
    ownerId: 'local_user_3',
    reviewNote: '',
    createdAtIso: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
  },
  {
    id: 'sub_33019482',
    uid: '33019482',
    accountName: 'Elena Rostova',
    status: 'rejected',
    ownerId: 'local_user_4',
    reviewNote: 'Region prefix mismatch — requested re-submission.',
    createdAtIso: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    updatedAtIso: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  },
];

function loadLocalSubmissions(): UidSubmissionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(INITIAL_SEED_SUBMISSIONS)
      );
      return INITIAL_SEED_SUBMISSIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback to in-memory seed if storage is restricted
  }
  return INITIAL_SEED_SUBMISSIONS;
}

function saveLocalSubmissions(records: UidSubmissionRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new CustomEvent('uid-submissions-updated'));
  } catch {
    // Ignore storage quota errors
  }
}

export function isSecretAdminUid(rawUid: string): boolean {
  return normalizeUid(rawUid) === ADMIN_SECRET_UID;
}

function sanitizeDocId(rawUid: string): string {
  const cleaned = normalizeUid(rawUid).replace(/[^a-zA-Z0-9_\-]/g, '');
  return (`sub_${cleaned || Date.now()}`).slice(
    0,
    BLUEPRINT_CONSTRAINTS.ID_MAX_LENGTH
  );
}

function formatTimestampToIso(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') {
    return val;
  }
  return new Date().toISOString();
}

export function useUidSubmissions() {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [localRecords, setLocalRecords] = useState<UidSubmissionRecord[]>(() =>
    loadLocalSubmissions()
  );
  const [cloudRecords, setCloudRecords] = useState<UidSubmissionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Track Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Listen to local storage events across components
  useEffect(() => {
    const handleStorageUpdate = () => {
      setLocalRecords(loadLocalSubmissions());
    };
    window.addEventListener('uid-submissions-updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('uid-submissions-updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Attach Firestore listener ONLY when auth is ready and user is signed in with verified email
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) {
      setCloudRecords([]);
      return;
    }

    setLoading(true);
    const isAdminUser = user.email === BOOTSTRAPPED_ADMIN_EMAIL;
    const colRef = collection(db, 'uid_submissions');
    const q = isAdminUser
      ? colRef
      : query(colRef, where('ownerId', '==', user.uid));

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs: UidSubmissionRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            uid: String(data.uid || ''),
            accountName: String(data.accountName || ''),
            status:
              data.status === 'verified' || data.status === 'rejected'
                ? data.status
                : 'pending',
            ownerId: String(data.ownerId || ''),
            reviewNote: String(data.reviewNote || ''),
            createdAtIso: formatTimestampToIso(data.createdAt),
            updatedAtIso: formatTimestampToIso(data.updatedAt),
          };
        });
        setCloudRecords(docs);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, 'uid_submissions');
      }
    );

    return () => unsub();
  }, [authReady, user]);

  // Merge cloud records and local records by ID so nothing is lost
  const mergedSubmissions = (() => {
    const map = new Map<string, UidSubmissionRecord>();
    for (const item of localRecords) {
      map.set(item.id, item);
    }
    for (const item of cloudRecords) {
      map.set(item.id, item);
    }
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b.updatedAtIso).getTime() - new Date(a.updatedAtIso).getTime()
    );
  })();

  const submitUidRecord = useCallback(
    async (rawUid: string, rawAccountName: string): Promise<UidSubmissionRecord> => {
      const normalized = normalizeUid(rawUid).slice(
        0,
        BLUEPRINT_CONSTRAINTS.UID_MAX_LENGTH
      );
      const safeAccountName = rawAccountName
        .trim()
        .slice(0, BLUEPRINT_CONSTRAINTS.ACCOUNT_NAME_MAX_LENGTH);
      const docId = sanitizeDocId(normalized);
      const nowIso = new Date().toISOString();

      const existingLocal = loadLocalSubmissions().find(
        (r) => r.id === docId || r.uid.toLowerCase() === normalized.toLowerCase()
      );

      const newRecord: UidSubmissionRecord = {
        id: existingLocal ? existingLocal.id : docId,
        uid: normalized,
        accountName: safeAccountName,
        status: existingLocal ? existingLocal.status : 'pending',
        ownerId: user?.uid || 'local_session_user',
        reviewNote: existingLocal ? existingLocal.reviewNote : '',
        createdAtIso: existingLocal ? existingLocal.createdAtIso : nowIso,
        updatedAtIso: nowIso,
      };

      const currentLocal = loadLocalSubmissions();
      const updatedLocal = [
        newRecord,
        ...currentLocal.filter((r) => r.id !== newRecord.id),
      ];
      saveLocalSubmissions(updatedLocal);
      setLocalRecords(updatedLocal);

      if (user && user.emailVerified) {
        const path = `uid_submissions/${newRecord.id}`;
        try {
          await setDoc(doc(db, 'uid_submissions', newRecord.id), {
            uid: newRecord.uid,
            accountName: newRecord.accountName,
            status: 'pending',
            ownerId: user.uid,
            reviewNote: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }

      return newRecord;
    },
    [user]
  );

  const updateVerificationStatus = useCallback(
    async (
      submissionId: string,
      newStatus: VerificationStatus,
      reviewNote: string = ''
    ) => {
      const safeNote = reviewNote
        .trim()
        .slice(0, BLUEPRINT_CONSTRAINTS.REVIEW_NOTE_MAX_LENGTH);
      const nowIso = new Date().toISOString();

      const currentLocal = loadLocalSubmissions();
      const existsInLocal = currentLocal.some((r) => r.id === submissionId);
      let updatedLocal: UidSubmissionRecord[];

      if (existsInLocal) {
        updatedLocal = currentLocal.map((r) =>
          r.id === submissionId
            ? {
                ...r,
                status: newStatus,
                reviewNote: safeNote,
                updatedAtIso: nowIso,
              }
            : r
        );
      } else {
        const cloudMatch = cloudRecords.find((r) => r.id === submissionId);
        updatedLocal = cloudMatch
          ? [
              {
                ...cloudMatch,
                status: newStatus,
                reviewNote: safeNote,
                updatedAtIso: nowIso,
              },
              ...currentLocal,
            ]
          : currentLocal;
      }

      saveLocalSubmissions(updatedLocal);
      setLocalRecords(updatedLocal);

      if (
        user &&
        user.emailVerified &&
        user.email === BOOTSTRAPPED_ADMIN_EMAIL &&
        cloudRecords.some((r) => r.id === submissionId)
      ) {
        const path = `uid_submissions/${submissionId}`;
        try {
          await updateDoc(doc(db, 'uid_submissions', submissionId), {
            status: newStatus,
            reviewNote: safeNote,
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, path);
        }
      }
    },
    [user, cloudRecords]
  );

  const deleteSubmissionRecord = useCallback(
    async (submissionId: string) => {
      const currentLocal = loadLocalSubmissions();
      const updatedLocal = currentLocal.filter((r) => r.id !== submissionId);
      saveLocalSubmissions(updatedLocal);
      setLocalRecords(updatedLocal);

      if (
        user &&
        user.emailVerified &&
        user.email === BOOTSTRAPPED_ADMIN_EMAIL &&
        cloudRecords.some((r) => r.id === submissionId)
      ) {
        const path = `uid_submissions/${submissionId}`;
        try {
          await deleteDoc(doc(db, 'uid_submissions', submissionId));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, path);
        }
      }
    },
    [user, cloudRecords]
  );

  const adminCreateVerifiedUid = useCallback(
    async (
      rawUid: string,
      rawAccountName: string,
      initialStatus: VerificationStatus,
      reviewNote: string
    ) => {
      const normalized = normalizeUid(rawUid).slice(
        0,
        BLUEPRINT_CONSTRAINTS.UID_MAX_LENGTH
      );
      const safeAccountName = rawAccountName
        .trim()
        .slice(0, BLUEPRINT_CONSTRAINTS.ACCOUNT_NAME_MAX_LENGTH);
      const safeNote = reviewNote
        .trim()
        .slice(0, BLUEPRINT_CONSTRAINTS.REVIEW_NOTE_MAX_LENGTH);
      const docId = sanitizeDocId(normalized);
      const nowIso = new Date().toISOString();

      const newRecord: UidSubmissionRecord = {
        id: docId,
        uid: normalized,
        accountName: safeAccountName || 'Direct Admin Entry',
        status: initialStatus,
        ownerId: user?.uid || 'admin_766758',
        reviewNote: safeNote,
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      };

      const currentLocal = loadLocalSubmissions();
      const updatedLocal = [
        newRecord,
        ...currentLocal.filter((r) => r.id !== docId),
      ];
      saveLocalSubmissions(updatedLocal);
      setLocalRecords(updatedLocal);

      if (
        user &&
        user.emailVerified &&
        user.email === BOOTSTRAPPED_ADMIN_EMAIL
      ) {
        const path = `uid_submissions/${docId}`;
        try {
          await setDoc(doc(db, 'uid_submissions', docId), {
            uid: newRecord.uid,
            accountName: newRecord.accountName,
            status: initialStatus,
            ownerId: user.uid,
            reviewNote: safeNote,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, path);
        }
      }
    },
    [user]
  );

  return {
    user,
    authReady,
    loading,
    submissions: mergedSubmissions,
    submitUidRecord,
    updateVerificationStatus,
    deleteSubmissionRecord,
    adminCreateVerifiedUid,
  };
}
