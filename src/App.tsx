/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { UidSubmissionCard } from './components/UidSubmissionCard';
import { AdminVerificationPanel } from './components/AdminVerificationPanel';

export default function App() {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);

  return (
    <div className="min-h-screen w-full bg-[#EBEEF7] relative flex items-center justify-center px-4 py-8 sm:py-12 overflow-x-hidden">
      {/* Subtle ambient radial studio glow behind the card matching the reference canvas */}
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.65)_0%,rgba(235,238,247,0)_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full">
        {isAdminUnlocked ? (
          <AdminVerificationPanel
            onExitAdmin={() => setIsAdminUnlocked(false)}
          />
        ) : (
          <UidSubmissionCard
            onOpenAdminPanel={() => setIsAdminUnlocked(true)}
          />
        )}
      </div>
    </div>
  );
}
