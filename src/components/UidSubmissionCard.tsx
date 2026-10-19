import React, { useState } from 'react';
import {
  ChevronLeft,
  ClipboardPaste,
  Copy,
  Check,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
} from 'lucide-react';
import { validateUid } from '../utils/uidValidation';
import { IllustrationGraphic } from './IllustrationGraphic';
import {
  useUidSubmissions,
  isSecretAdminUid,
  ADMIN_SECRET_UID,
  BLUEPRINT_CONSTRAINTS,
} from '../services/uidSubmissionStore';

type CardViewMode = 'form' | 'guide' | 'submitted';

interface UidSubmissionCardProps {
  onOpenAdminPanel: () => void;
}

export const UidSubmissionCard: React.FC<UidSubmissionCardProps> = ({
  onOpenAdminPanel,
}) => {
  const { submissions, submitUidRecord } = useUidSubmissions();

  const [viewMode, setViewMode] = useState<CardViewMode>('form');
  const [uidInput, setUidInput] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [maskUid, setMaskUid] = useState<boolean>(false);
  const [touched, setTouched] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string>('');
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null);

  const validation = validateUid(uidInput);
  const isAdminCodeTyped = isSecretAdminUid(uidInput);
  const showError = touched && !validation.isValid;

  // Look up live verification state of the user's submitted UID
  const liveSubmission = submissions.find(
    (s) =>
      (lastSubmittedId && s.id === lastSubmittedId) ||
      (validation.normalizedUid &&
        s.uid.toLowerCase() === validation.normalizedUid.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    // Check if the entered UID is the secret Admin UID (766758)
    if (isSecretAdminUid(uidInput)) {
      onOpenAdminPanel();
      return;
    }

    if (!validation.isValid) {
      return;
    }

    const saved = await submitUidRecord(validation.normalizedUid, accountName);
    setLastSubmittedId(saved.id);

    const now = new Date();
    setSubmittedAt(
      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    setViewMode('submitted');
  };

  const handlePasteUid = async () => {
    setClipboardFeedback(null);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setUidInput(text.trim());
          setTouched(true);
          setClipboardFeedback('Pasted from clipboard');
          setTimeout(() => setClipboardFeedback(null), 2200);
          return;
        }
      }
    } catch {
      // Fallback if clipboard permission is blocked in iframe
    }
    const fallbackUid = '849201563';
    setUidInput(fallbackUid);
    setTouched(true);
    setClipboardFeedback('Inserted UID from quick slot');
    setTimeout(() => setClipboardFeedback(null), 2200);
  };

  const handleFillSample = () => {
    setUidInput('UID-84920148');
    if (!accountName) {
      setAccountName('Nicholas Ergemla');
    }
    setTouched(true);
    setClipboardFeedback(null);
  };

  const handleCopySubmittedUid = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(validation.normalizedUid);
      }
    } catch {
      // Ignore iframe clipboard errors
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHeaderAction = () => {
    if (viewMode === 'form') {
      setViewMode('guide');
    } else {
      setViewMode('form');
    }
  };

  return (
    <div className="w-full max-w-[390px] mx-auto rounded-[34px] overflow-hidden shadow-[0_28px_70px_-12px_rgba(37,32,208,0.18)] bg-gradient-to-br from-[#231ECF] via-[#4640E5] to-[#6D66F6] relative flex flex-col">
      {/* Subtle radial top-right light highlight */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />

      {/* Top Header Zone */}
      <header className="px-6 pt-7 pb-6 relative z-10">
        {/* Navigation Row */}
        <div className="flex items-center justify-between min-h-[36px]">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'form' ? 'guide' : 'form')}
            aria-label={viewMode === 'form' ? 'Open UID guide' : 'Back to UID form'}
            className="w-8 h-8 -ml-1.5 rounded-lg flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="flex items-center gap-2.5">
            <span className="text-[12px] text-white/75 font-medium">
              {viewMode === 'form'
                ? 'Need help finding UID?'
                : 'Ready to submit?'}
            </span>
            <button
              type="button"
              onClick={handleHeaderAction}
              className="px-3.5 py-1.5 rounded-[9px] bg-white/20 hover:bg-white/30 active:scale-[0.98] text-white text-[12px] font-semibold backdrop-blur-sm transition-all cursor-pointer whitespace-nowrap"
            >
              {viewMode === 'form' ? 'UID Guide' : 'Enter UID'}
            </button>
          </div>
        </div>

        {/* Brand Wordmark & Step Dots */}
        <div className="mt-5 mb-2 text-center">
          <h1 className="text-[31px] font-extrabold tracking-tight text-white leading-none">
            Jobsly
          </h1>
          {/* Step Progress Indicator matching center screen in reference */}
          <div
            className="flex items-center justify-center gap-1.5 mt-4"
            aria-label="Step 1 of 3"
          >
            <span
              className={`h-1.5 rounded-full transition-all duration-200 ${
                viewMode === 'submitted'
                  ? 'w-1.5 bg-white/45'
                  : 'w-4 bg-white'
              }`}
            />
            <span
              className={`h-1.5 rounded-full transition-all duration-200 ${
                viewMode === 'submitted'
                  ? 'w-4 bg-white'
                  : 'w-1.5 border border-white/50'
              }`}
            />
            <span className="w-1.5 h-1.5 rounded-full border border-white/50" />
          </div>
        </div>
      </header>

      {/* Recessed Layered Card Lip */}
      <div
        className="mx-5 h-3.5 rounded-t-[24px] bg-white/20 backdrop-blur-xs"
        aria-hidden="true"
      />

      {/* Main White Sheet Body */}
      <main className="bg-white rounded-t-[30px] px-7 pt-8 pb-5 flex-1 flex flex-col justify-between relative z-10">
        {viewMode === 'form' && (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1">
            {/* Heading & Subtitle */}
            <div className="text-center mb-7">
              <h2 className="text-[24px] font-bold text-[#1F2233] tracking-tight">
                Submit Your UID
              </h2>
              <p className="text-[14px] text-[#7E829E] mt-1.5">
                Enter your details below
              </p>
            </div>

            {/* Stacked Floating-Label Boxed Inputs */}
            <div className="space-y-4">
              {/* Primary UID Input Box */}
              <div>
                <div
                  className={`rounded-[14px] border bg-white px-4 py-2.5 transition-all ${
                    showError
                      ? 'border-[#EF4444] bg-[#FEF2F2]/30'
                      : isAdminCodeTyped
                        ? 'border-[#231ECF] shadow-[0_4px_20px_rgba(35,30,207,0.12)]'
                        : 'border-[#E6E8F2] focus-within:border-[#4943E6] focus-within:shadow-[0_4px_20px_rgba(73,67,230,0.08)]'
                  }`}
                >
                  <label
                    htmlFor="uid-input"
                    className="block text-[11px] font-medium text-[#969AB4] leading-tight mb-1 cursor-text"
                  >
                    User ID (UID)
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      id="uid-input"
                      type={maskUid ? 'password' : 'text'}
                      value={uidInput}
                      maxLength={BLUEPRINT_CONSTRAINTS.UID_MAX_LENGTH}
                      onChange={(e) => {
                        setUidInput(e.target.value);
                        if (clipboardFeedback) setClipboardFeedback(null);
                      }}
                      onBlur={() => {
                        if (uidInput.length > 0) setTouched(true);
                      }}
                      placeholder="e.g. 849201482 or UID-849201"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full text-[14px] font-semibold text-[#1F2233] placeholder:text-[#C2C6D8] placeholder:font-normal focus:outline-none bg-transparent font-mono-tabular"
                    />

                    {/* Inline 3-Bar Format Indicator */}
                    {uidInput.trim().length > 0 && (
                      <div
                        className="flex items-center gap-2 shrink-0"
                        aria-live="polite"
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={`w-2.5 h-1 rounded-full transition-colors ${
                              validation.strengthLevel >= 1
                                ? validation.isValid
                                  ? 'bg-[#28C76F]'
                                  : 'bg-[#F59E0B]'
                                : 'bg-[#E2E5F0]'
                            }`}
                          />
                          <span
                            className={`w-2.5 h-1 rounded-full transition-colors ${
                              validation.strengthLevel >= 2
                                ? validation.isValid
                                  ? 'bg-[#28C76F]'
                                  : 'bg-[#F59E0B]'
                                : 'bg-[#E2E5F0]'
                            }`}
                          />
                          <span
                            className={`w-2.5 h-1 rounded-full transition-colors ${
                              validation.strengthLevel >= 3
                                ? 'bg-[#28C76F]'
                                : 'bg-[#E2E5F0]'
                            }`}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-semibold ${
                            isAdminCodeTyped
                              ? 'text-[#231ECF]'
                              : validation.isValid
                                ? 'text-[#28C76F]'
                                : 'text-[#F59E0B]'
                          }`}
                        >
                          {isAdminCodeTyped
                            ? 'Admin Key'
                            : validation.isValid
                              ? 'Valid'
                              : validation.statusLabel}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validation Error or Clipboard Feedback */}
                {showError && validation.errorMessage && (
                  <p
                    role="alert"
                    className="flex items-center gap-1.5 text-[12px] text-[#DC2626] font-medium mt-1.5 pl-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validation.errorMessage}</span>
                  </p>
                )}
                {!showError && isAdminCodeTyped && (
                  <p className="flex items-center gap-1.5 text-[12px] text-[#231ECF] font-semibold mt-1.5 pl-1">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Secret Admin UID recognized — press Enter to open Admin Panel</span>
                  </p>
                )}
                {!showError && !isAdminCodeTyped && clipboardFeedback && (
                  <p className="text-[12px] text-[#4943E6] font-medium mt-1.5 pl-1">
                    {clipboardFeedback}
                  </p>
                )}
              </div>

              {/* Secondary Boxed Input */}
              <div className="rounded-[14px] border border-[#E6E8F2] bg-white px-4 py-2.5 focus-within:border-[#4943E6] focus-within:shadow-[0_4px_20px_rgba(73,67,230,0.08)] transition-all">
                <label
                  htmlFor="account-name-input"
                  className="block text-[11px] font-medium text-[#969AB4] leading-tight mb-1 cursor-text"
                >
                  Account Name (Optional)
                </label>
                <div className="flex items-center justify-between gap-2">
                  <input
                    id="account-name-input"
                    type="text"
                    value={accountName}
                    maxLength={BLUEPRINT_CONSTRAINTS.ACCOUNT_NAME_MAX_LENGTH}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="nicholas@ergemla.com or username"
                    autoComplete="off"
                    className="w-full text-[14px] font-medium text-[#1F2233] placeholder:text-[#C2C6D8] placeholder:font-normal focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setMaskUid((prev) => !prev)}
                    aria-label={maskUid ? 'Show UID characters' : 'Hide UID characters'}
                    title={maskUid ? 'Show UID' : 'Mask UID'}
                    className="text-[#969AB4] hover:text-[#4943E6] transition-colors p-0.5 cursor-pointer shrink-0"
                  >
                    {maskUid ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Primary Gradient Submit CTA */}
            <button
              type="submit"
              className="w-full h-[52px] mt-5 rounded-[14px] bg-gradient-to-r from-[#2823D5] via-[#7B5BF7] to-[#E385FA] hover:opacity-95 active:scale-[0.99] text-white text-[14px] font-semibold tracking-wide shadow-[0_12px_26px_-6px_rgba(115,82,246,0.48)] transition-all cursor-pointer"
            >
              {isAdminCodeTyped ? 'Enter Admin Panel' : 'Submit UID'}
            </button>

            {/* Secondary Link Below Button */}
            <div className="text-center mt-5">
              <button
                type="button"
                onClick={() => setViewMode('guide')}
                className="text-[13px] font-medium text-[#5A5E78] hover:text-[#2823D5] transition-colors cursor-pointer"
              >
                Where can I find my UID?
              </button>
            </div>

            {/* Divider with Centered Label */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-[1px] flex-1 bg-[#ECEDF5]" />
              <span className="text-[12px] text-[#969AB4] font-medium">
                Or quick fill with
              </span>
              <div className="h-[1px] flex-1 bg-[#ECEDF5]" />
            </div>

            {/* Bottom 2 Side-by-Side Bordered Action Buttons */}
            <div className="grid grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={handlePasteUid}
                className="h-[48px] rounded-[14px] border border-[#E6E8F2] hover:border-[#C9CEE4] hover:bg-[#F9FAFD] active:scale-[0.98] flex items-center justify-center gap-2 text-[13px] font-semibold text-[#2A2E45] transition-all cursor-pointer"
              >
                <ClipboardPaste className="w-4 h-4 text-[#EA4335]" />
                <span>Paste UID</span>
              </button>

              <button
                type="button"
                onClick={handleFillSample}
                className="h-[48px] rounded-[14px] border border-[#E6E8F2] hover:border-[#C9CEE4] hover:bg-[#F9FAFD] active:scale-[0.98] flex items-center justify-center gap-2 text-[13px] font-semibold text-[#2A2E45] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#3B82F6]" />
                <span>Sample UID</span>
              </button>
            </div>
          </form>
        )}

        {viewMode === 'guide' && (
          <div className="flex flex-col flex-1 justify-between text-center">
            <div className="pt-1">
              <IllustrationGraphic mode="guide" />

              <p className="text-[12px] font-semibold text-[#6E728E] mt-4">
                Jobsly UID Verification
              </p>
              <h2 className="text-[21px] font-bold text-[#1F2233] leading-snug mt-2 px-2 text-balance">
                Locate and submit your unique ID for the next step
              </h2>

              <div className="mt-4 text-left bg-[#F8F9FD] border border-[#ECEDF6] rounded-[14px] p-3.5 space-y-2 text-[12px] text-[#5A5E78]">
                <p>
                  <strong className="text-[#1F2233]">1. Open Profile:</strong> Go
                  to your account settings or profile badge.
                </p>
                <p>
                  <strong className="text-[#1F2233]">2. Copy UID:</strong> Copy
                  your 6–24 character numeric or alphanumeric ID.
                </p>
                <p>
                  <strong className="text-[#1F2233]">Admin Verification:</strong>{' '}
                  Enter secret admin UID{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setUidInput(ADMIN_SECRET_UID);
                      setTouched(true);
                      setViewMode('form');
                    }}
                    className="font-mono-tabular font-bold text-[#352FDB] underline cursor-pointer"
                  >
                    {ADMIN_SECRET_UID}
                  </button>{' '}
                  in the UID field to launch the verification console.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('form')}
              className="w-full h-[52px] mt-6 rounded-[14px] bg-[#EFEDFD] hover:bg-[#E4E1FC] active:scale-[0.99] text-[#352FDB] text-[14px] font-bold transition-all cursor-pointer"
            >
              Back to Submit UID
            </button>
          </div>
        )}

        {viewMode === 'submitted' && (
          <div className="flex flex-col flex-1 justify-between text-center">
            <div className="pt-1">
              <IllustrationGraphic mode="success" />

              {/* Live Verification Status Header */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] font-semibold">
                {(!liveSubmission || liveSubmission.status === 'pending') && (
                  <span className="inline-flex items-center gap-1.5 text-[#D97706]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Admin Verification · {submittedAt}</span>
                  </span>
                )}
                {liveSubmission?.status === 'verified' && (
                  <span className="inline-flex items-center gap-1.5 text-[#16A34A]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>UID Verified by Admin · {submittedAt}</span>
                  </span>
                )}
                {liveSubmission?.status === 'rejected' && (
                  <span className="inline-flex items-center gap-1.5 text-[#DC2626]">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>UID Verification Declined · {submittedAt}</span>
                  </span>
                )}
              </div>

              <h2 className="text-[21px] font-bold text-[#1F2233] leading-snug mt-1.5 px-2 text-balance">
                {liveSubmission?.status === 'verified'
                  ? 'Your UID has been verified and approved'
                  : liveSubmission?.status === 'rejected'
                    ? 'Please review and update your submitted UID'
                    : 'UID received and queued for admin verification'}
              </h2>

              {/* Submitted UID Summary Card */}
              <div className="mt-5 rounded-[14px] border border-[#E6E8F2] bg-[#F9FAFD] px-4 py-3 text-left flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="block text-[11px] font-medium text-[#969AB4]">
                    Submitted UID
                    {accountName.trim() ? ` · ${accountName.trim()}` : ''}
                  </span>
                  <span
                    data-testid="submitted-uid-value"
                    className="block text-[15px] font-bold text-[#1F2233] font-mono-tabular truncate mt-0.5"
                  >
                    {validation.normalizedUid}
                  </span>
                  {liveSubmission?.reviewNote && (
                    <span className="block text-[11px] text-[#5A5E78] mt-1">
                      Note: {liveSubmission.reviewNote}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleCopySubmittedUid}
                  aria-label="Copy submitted UID"
                  className="px-3 py-1.5 rounded-lg border border-[#E2E5F0] bg-white hover:bg-[#F3F4FA] text-[12px] font-semibold text-[#352FDB] flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#28C76F]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => setViewMode('form')}
                className="w-full h-[50px] rounded-[14px] bg-[#EFEDFD] hover:bg-[#E4E1FC] active:scale-[0.99] text-[#352FDB] text-[14px] font-bold transition-all cursor-pointer"
              >
                Edit or Submit Another UID
              </button>
            </div>
          </div>
        )}

        {/* Bottom Home Indicator Bar */}
        <div
          className="w-32 h-1.5 rounded-full bg-[#DCDFE9] mx-auto mt-7"
          aria-hidden="true"
        />
      </main>
    </div>
  );
};
