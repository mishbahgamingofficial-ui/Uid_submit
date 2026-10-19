import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Trash2,
  RotateCcw,
  Plus,
  ArrowLeft,
  ShieldCheck,
  LogIn,
  LogOut,
  Check,
  Copy,
  AlertCircle,
} from 'lucide-react';
import {
  useUidSubmissions,
  VerificationStatus,
  UidSubmissionRecord,
  ADMIN_SECRET_UID,
  BLUEPRINT_CONSTRAINTS,
} from '../services/uidSubmissionStore';
import { validateUid } from '../utils/uidValidation';
import { signInWithGoogle, signOutUser } from '../firebase';

interface AdminVerificationPanelProps {
  onExitAdmin: () => void;
}

type StatusFilter = 'all' | VerificationStatus;

export const AdminVerificationPanel: React.FC<AdminVerificationPanelProps> = ({
  onExitAdmin,
}) => {
  const {
    user,
    submissions,
    updateVerificationStatus,
    deleteSubmissionRecord,
    adminCreateVerifiedUid,
  } = useUidSubmissions();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual quick-verify form state
  const [newUid, setNewUid] = useState<string>('');
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newNote, setNewNote] = useState<string>('');
  const [newFormError, setNewFormError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const total = submissions.length;
    const pending = submissions.filter((s) => s.status === 'pending').length;
    const verified = submissions.filter((s) => s.status === 'verified').length;
    const rejected = submissions.filter((s) => s.status === 'rejected').length;
    return { total, pending, verified, rejected };
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        item.uid.toLowerCase().includes(q) ||
        item.accountName.toLowerCase().includes(q) ||
        item.reviewNote.toLowerCase().includes(q)
      );
    });
  }, [submissions, statusFilter, searchQuery]);

  const activeRecord: UidSubmissionRecord | null = useMemo(() => {
    if (selectedId) {
      const found = submissions.find((s) => s.id === selectedId);
      if (found) return found;
    }
    return filteredSubmissions[0] || null;
  }, [selectedId, submissions, filteredSubmissions]);

  const currentNoteValue = activeRecord
    ? noteDrafts[activeRecord.id] !== undefined
      ? noteDrafts[activeRecord.id]
      : activeRecord.reviewNote
    : '';

  const handleCopyUid = async (id: string, uidText: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(uidText);
      }
    } catch {
      // Ignore iframe clipboard restriction
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleVerifyAction = async (
    record: UidSubmissionRecord,
    targetStatus: VerificationStatus
  ) => {
    const noteToSave =
      noteDrafts[record.id] !== undefined
        ? noteDrafts[record.id]
        : record.reviewNote ||
          (targetStatus === 'verified'
            ? 'Verified by Admin (766758)'
            : targetStatus === 'rejected'
              ? 'UID verification declined by Admin'
              : '');
    await updateVerificationStatus(record.id, targetStatus, noteToSave);
  };

  const handleManualAddAndVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewFormError(null);
    const check = validateUid(newUid);
    if (!check.isValid) {
      setNewFormError(check.errorMessage || 'Invalid UID format.');
      return;
    }
    await adminCreateVerifiedUid(
      check.normalizedUid,
      newAccountName,
      'verified',
      newNote || 'Manually verified in Admin Panel'
    );
    setNewUid('');
    setNewAccountName('');
    setNewNote('');
  };

  const handleGoogleSync = async () => {
    setAuthError(null);
    try {
      if (user) {
        await signOutUser();
      } else {
        await signInWithGoogle();
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Authentication popup closed.'
      );
    }
  };

  const formatShortTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="w-full max-w-[1160px] mx-auto bg-white border border-[#DCE0EE] rounded-[20px] shadow-[0_20px_50px_rgba(31,34,51,0.08)] overflow-hidden text-[#1F2233]">
      {/* Top Bar Contract: Breadcrumb / Brand on Left, Actions on Right */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#E6E8F2] bg-[#FAFBFD]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#231ECF] text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[15px] font-bold tracking-tight text-[#1F2233]">
              <span>Jobsly Admin Console</span>
              <span className="text-[#969AB4]" aria-hidden="true">
                /
              </span>
              <span className="text-[#4640E5] font-mono-tabular">
                Key #{ADMIN_SECRET_UID}
              </span>
            </div>
            <p className="text-[12px] text-[#6E728E]">
              User Identification Verification &amp; Review Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleGoogleSync}
            className="px-3.5 py-2 rounded-lg border border-[#DCE0EE] bg-white hover:bg-[#F4F6FB] text-[12px] font-semibold text-[#2A2E45] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {user ? (
              <>
                <LogOut className="w-3.5 h-3.5 text-[#6E728E]" />
                <span>Cloud Synced ({user.email?.split('@')[0]})</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-[#4640E5]" />
                <span>Sync with Google</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onExitAdmin}
            className="px-4 py-2 rounded-lg bg-[#1F2233] hover:bg-[#2F344D] text-white text-[12px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to UID Portal</span>
          </button>
        </div>
      </header>

      {authError && (
        <div className="px-6 py-2.5 bg-[#FEF2F2] border-b border-[#FECACA] text-[12px] text-[#DC2626] flex items-center justify-between">
          <span>{authError}</span>
          <button
            type="button"
            onClick={() => setAuthError(null)}
            className="text-[11px] font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4-Column Metric Strip */}
      <section
        aria-label="Verification statistics"
        className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#E6E8F2] divide-y sm:divide-y-0 sm:divide-x divide-[#E6E8F2] bg-white"
      >
        <div className="px-6 py-4">
          <span className="block text-[12px] font-medium text-[#6E728E]">
            Total Submissions
          </span>
          <span className="block text-[24px] font-bold text-[#1F2233] font-mono-tabular mt-1">
            {counts.total}
          </span>
        </div>

        <div className="px-6 py-4">
          <span className="block text-[12px] font-medium text-[#6E728E]">
            Pending Review
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[24px] font-bold text-[#D97706] font-mono-tabular">
              {counts.pending}
            </span>
            <span className="text-[12px] text-[#6E728E]">awaiting action</span>
          </div>
        </div>

        <div className="px-6 py-4">
          <span className="block text-[12px] font-medium text-[#6E728E]">
            Verified UIDs
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[24px] font-bold text-[#16A34A] font-mono-tabular">
              {counts.verified}
            </span>
            <span className="text-[12px] text-[#6E728E]">approved</span>
          </div>
        </div>

        <div className="px-6 py-4">
          <span className="block text-[12px] font-medium text-[#6E728E]">
            Rejected UIDs
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-[24px] font-bold text-[#DC2626] font-mono-tabular">
              {counts.rejected}
            </span>
            <span className="text-[12px] text-[#6E728E]">declined</span>
          </div>
        </div>
      </section>

      {/* Main Split Workspace: Left Table Queue + Right Verification Inspector & Direct Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        {/* Left 7 Columns: Search, Filter Tabs, and High-Density Table */}
        <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-[#E6E8F2] flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-[#E6E8F2] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAFBFD]">
            {/* Segmented Interactive Filter Buttons */}
            <div
              role="tablist"
              aria-label="Filter submissions by status"
              className="flex items-center gap-1 p-1 bg-[#EBEEF7] rounded-lg"
            >
              {(
                [
                  { id: 'all', label: `All (${counts.total})` },
                  { id: 'pending', label: `Pending (${counts.pending})` },
                  { id: 'verified', label: `Verified (${counts.verified})` },
                  { id: 'rejected', label: `Rejected (${counts.rejected})` },
                ] as { id: StatusFilter; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 font-mono-tabular ${
                    statusFilter === tab.id
                      ? 'bg-white text-[#1F2233] shadow-xs'
                      : 'text-[#5A5E78] hover:text-[#1F2233]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-[#969AB4] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search UID or account..."
                aria-label="Search UID or account name"
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#DCE0EE] bg-white text-[13px] text-[#1F2233] placeholder:text-[#969AB4] focus:outline-none focus:border-[#4640E5]"
              />
            </div>
          </div>

          {/* Submissions List / High-Density Data Grid */}
          <div className="flex-1 overflow-x-auto">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-[14px] font-semibold text-[#1F2233]">
                  No UID submissions match your current filter
                </p>
                <p className="text-[12px] text-[#6E728E] mt-1">
                  Try clearing the search query or switching status tabs.
                </p>
                {statusFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-4 px-3.5 py-1.5 rounded-lg border border-[#DCE0EE] text-[12px] font-semibold text-[#352FDB] hover:bg-[#F4F6FB] cursor-pointer"
                  >
                    Show All Submissions
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E8F2] bg-[#FAFBFD] text-[11px] font-semibold text-[#6E728E]">
                    <th className="py-2.5 pl-5 pr-3">Submitted UID</th>
                    <th className="py-2.5 px-3">Account</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                    <th className="py-2.5 pl-3 pr-5 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E8F2] text-[13px]">
                  {filteredSubmissions.map((item) => {
                    const isSelected = activeRecord?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#F3F4FC]'
                            : 'hover:bg-[#FAFBFD]'
                        }`}
                      >
                        <td className="py-3 pl-5 pr-3 font-mono-tabular font-semibold text-[#1F2233] whitespace-nowrap">
                          {item.uid}
                        </td>
                        <td className="py-3 px-3 text-[#4A4E68] truncate max-w-[150px]">
                          {item.accountName || 'Unassigned'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {item.status === 'verified' && (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#16A34A]">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Verified</span>
                            </span>
                          )}
                          {item.status === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#D97706]">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Pending</span>
                            </span>
                          )}
                          {item.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#DC2626]">
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-[12px] text-[#6E728E] font-mono-tabular whitespace-nowrap">
                          {formatShortTime(item.updatedAtIso)}
                        </td>
                        <td
                          className="py-3 pl-3 pr-5 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {item.status !== 'verified' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleVerifyAction(item, 'verified')
                                }
                                title="Verify UID"
                                className="px-2.5 py-1 rounded-md bg-[#16A34A] hover:bg-[#15803D] text-white text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Verify
                              </button>
                            )}
                            {item.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleVerifyAction(item, 'rejected')
                                }
                                title="Reject UID"
                                className="px-2.5 py-1 rounded-md border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#DC2626] text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right 5 Columns: Selected UID Verification Inspector + Direct Admin Entry */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#FAFBFD] p-6 space-y-6">
          {/* Inspector Section */}
          {activeRecord ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-[#E6E8F2] pb-4">
                <div>
                  <span className="text-[11px] font-semibold text-[#6E728E]">
                    Selected Submission Record
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-[22px] font-bold text-[#1F2233] font-mono-tabular">
                      {activeRecord.uid}
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyUid(activeRecord.id, activeRecord.uid)
                      }
                      aria-label="Copy UID"
                      className="p-1.5 rounded-md border border-[#DCE0EE] bg-white hover:bg-[#F3F4FA] text-[#4640E5] transition-colors cursor-pointer"
                    >
                      {copiedId === activeRecord.id ? (
                        <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[13px] text-[#5A5E78] mt-1">
                    Account:{' '}
                    <strong className="text-[#1F2233]">
                      {activeRecord.accountName || 'No account name provided'}
                    </strong>
                    <span className="mx-1.5 text-[#969AB4]" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-mono-tabular text-[12px]">
                      Updated {formatShortTime(activeRecord.updatedAtIso)}
                    </span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => deleteSubmissionRecord(activeRecord.id)}
                  title="Delete submission record"
                  aria-label="Delete submission record"
                  className="p-2 rounded-lg border border-[#E6E8F2] bg-white hover:border-[#FECACA] hover:text-[#DC2626] text-[#6E728E] transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Admin Note Field */}
              <div>
                <label
                  htmlFor="admin-review-note"
                  className="block text-[12px] font-semibold text-[#4A4E68] mb-1.5"
                >
                  Verification Note / Audit Remark
                </label>
                <textarea
                  id="admin-review-note"
                  rows={2}
                  maxLength={BLUEPRINT_CONSTRAINTS.REVIEW_NOTE_MAX_LENGTH}
                  value={currentNoteValue}
                  onChange={(e) =>
                    setNoteDrafts((prev) => ({
                      ...prev,
                      [activeRecord.id]: e.target.value,
                    }))
                  }
                  placeholder="Add verification note or reason for rejection..."
                  className="w-full rounded-lg border border-[#DCE0EE] bg-white px-3 py-2 text-[13px] text-[#1F2233] placeholder:text-[#969AB4] focus:outline-none focus:border-[#4640E5]"
                />
              </div>

              {/* Primary Verification Decision Buttons */}
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleVerifyAction(activeRecord, 'verified')}
                  className="h-[42px] rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify UID</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVerifyAction(activeRecord, 'rejected')}
                  className="h-[42px] rounded-lg bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject UID</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVerifyAction(activeRecord, 'pending')}
                  className="h-[42px] rounded-lg border border-[#DCE0EE] bg-white hover:bg-[#F3F4FA] text-[#4A4E68] text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Set Pending</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center border-b border-[#E6E8F2]">
              <p className="text-[13px] text-[#6E728E]">
                Select any UID submission from the table to inspect or verify.
              </p>
            </div>
          )}

          {/* Direct Admin UID Registration & Instant Verification */}
          <form
            onSubmit={handleManualAddAndVerify}
            className="pt-5 border-t border-[#E6E8F2] space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-[#1F2233]">
                Direct UID Verification
              </h3>
              <span className="text-[11px] text-[#6E728E]">
                Instant Admin Approval
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="admin-quick-uid"
                  className="block text-[11px] font-medium text-[#6E728E] mb-1"
                >
                  User UID
                </label>
                <input
                  id="admin-quick-uid"
                  type="text"
                  value={newUid}
                  onChange={(e) => {
                    setNewUid(e.target.value);
                    if (newFormError) setNewFormError(null);
                  }}
                  placeholder="e.g. UID-7749201"
                  maxLength={BLUEPRINT_CONSTRAINTS.UID_MAX_LENGTH}
                  className="w-full rounded-lg border border-[#DCE0EE] bg-white px-3 py-2 text-[13px] font-mono-tabular font-semibold text-[#1F2233] placeholder:text-[#969AB4] placeholder:font-normal focus:outline-none focus:border-[#4640E5]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-quick-account"
                  className="block text-[11px] font-medium text-[#6E728E] mb-1"
                >
                  Account Name
                </label>
                <input
                  id="admin-quick-account"
                  type="text"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Player or user name"
                  maxLength={BLUEPRINT_CONSTRAINTS.ACCOUNT_NAME_MAX_LENGTH}
                  className="w-full rounded-lg border border-[#DCE0EE] bg-white px-3 py-2 text-[13px] text-[#1F2233] placeholder:text-[#969AB4] focus:outline-none focus:border-[#4640E5]"
                />
              </div>
            </div>

            {newFormError && (
              <p className="flex items-center gap-1.5 text-[12px] text-[#DC2626] font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{newFormError}</span>
              </p>
            )}

            <button
              type="submit"
              className="w-full h-[40px] rounded-lg bg-[#231ECF] hover:bg-[#352FDB] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add &amp; Verify UID</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
