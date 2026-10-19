# Security Specification (`security_spec.md`)

## 1. Data Invariants

1. **Global Default Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Authentication**: Every read and write operation requires `request.auth != null` and `request.auth.token.email_verified == true`.
3. **Path Variable Hardening**: Every single-document path variable (`{submissionId}`, `{adminUid}`) must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.
4. **Strict Schema & Key Enforcement (`UidSubmission`)**:
   - Exact keys required and allowed: `['uid', 'accountName', 'status', 'ownerId', 'reviewNote', 'createdAt', 'updatedAt']`.
   - `uid`: string, size 6..24, matches `^[A-Za-z0-9\-_]+$`.
   - `accountName`: string, size 0..80.
   - `status`: string, size <= 16, one of `'pending'`, `'verified'`, `'rejected'`.
   - `ownerId`: string, size 1..128, matches `^[a-zA-Z0-9_\-]+$`.
   - `reviewNote`: string, size 0..240.
   - `createdAt` & `updatedAt`: `timestamp` equal to `request.time` on creation; `createdAt` and `ownerId` are immutable on update while `updatedAt == request.time`.
5. **Creation State Invariant**: Non-admin users creating a `UidSubmission` must set `ownerId == request.auth.uid`, `status == 'pending'`, and `reviewNote == ''`.
6. **Tiered Action-Based Updates**:
   - **Owner Edit Action**: Only allowed when `existing().status == 'pending'` (terminal state lock once `'verified'` or `'rejected'`), `existing().ownerId == request.auth.uid`, and `affectedKeys().hasOnly(['uid', 'accountName', 'updatedAt'])`.
   - **Admin Verification Action**: Allowed for `isAdmin()`, where `incoming().ownerId == existing().ownerId`, `incoming().createdAt == existing().createdAt`, and `affectedKeys().hasOnly(['status', 'reviewNote', 'updatedAt', 'uid', 'accountName'])`.
7. **Secure List & Read Isolation**:
   - `allow get, list` on `/uid_submissions/{submissionId}` is restricted strictly to `resource.data.ownerId == request.auth.uid || isAdmin()`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Unauthenticated Write**: `auth = null`, creating `/uid_submissions/sub_1` -> `PERMISSION_DENIED`.
2. **Spoofed Unverified Admin Email**: `auth = { uid: 'u1', token: { email: 'mishbahgamingofficial@gmail.com', email_verified: false } }` reading all submissions -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: `auth.uid = 'user_a'`, payload has `ownerId: 'user_b'` -> `PERMISSION_DENIED`.
4. **Self-Verification on Create**: Non-admin creates submission with `status: 'verified'` -> `PERMISSION_DENIED`.
5. **Shadow / Ghost Field Injection**: Payload includes extra field `isAdmin: true` -> `PERMISSION_DENIED`.
6. **ID Poisoning**: Document ID with special characters or length > 128 -> `PERMISSION_DENIED`.
7. **Denial-of-Wallet Oversized String**: `accountName` with 5,000 characters or `reviewNote` with 10,000 characters -> `PERMISSION_DENIED`.
8. **Invalid UID Pattern**: `uid: '123456<script>'` -> `PERMISSION_DENIED`.
9. **Timestamp Forgery**: Client passes forged `createdAt` or `updatedAt` != `request.time` -> `PERMISSION_DENIED`.
10. **Terminal State Bypass by Owner**: Owner attempts to update `uid` after `status` is already `'verified'` -> `PERMISSION_DENIED`.
11. **Immutable Field Mutation**: Admin or owner attempts to mutate `createdAt` or `ownerId` during update -> `PERMISSION_DENIED`.
12. **Unauthorized Cross-User List/Get**: Authenticated `user_a` attempts to `get` or `list` submissions where `ownerId == 'user_b'` -> `PERMISSION_DENIED`.
