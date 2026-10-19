import React from 'react';
import { Check, Plus } from 'lucide-react';

interface IllustrationGraphicProps {
  mode?: 'guide' | 'success';
}

export const IllustrationGraphic: React.FC<IllustrationGraphicProps> = ({ mode = 'guide' }) => {
  return (
    <div className="relative w-56 h-52 mx-auto flex items-center justify-center select-none" aria-hidden="true">
      {/* Soft circular lavender backdrop */}
      <div className="w-40 h-40 rounded-full bg-[#F1F3FA] absolute top-3 left-1/2 -translate-x-1/2" />

      {/* Decorative floating dots */}
      <div className="w-3.5 h-3.5 rounded-full bg-[#E1E5F2] absolute left-3 top-24" />
      <div className="w-2.5 h-2.5 rounded-full bg-[#E1E5F2] absolute right-4 top-10" />

      {/* Left tilted document card */}
      <div
        className="w-20 h-24 bg-white rounded-xl shadow-[0_10px_25px_rgba(39,35,212,0.08)] border border-[#F0F1F7] absolute left-4 top-9 -rotate-12 p-2.5 flex flex-col justify-between"
      >
        {/* Happy yellow-accented face */}
        <div className="flex flex-col items-center mt-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-1 border-t-2 border-[#3A3D52] rounded-t-full" />
            <span className="w-2 h-1 border-t-2 border-[#3A3D52] rounded-t-full" />
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <span className="w-1.5 h-1 rounded-full bg-[#FCD34D]" />
            <span className="w-2 h-1 border-b-2 border-[#F59E0B] rounded-b-full" />
            <span className="w-1.5 h-1 rounded-full bg-[#FCD34D]" />
          </div>
        </div>
        {/* Document skeleton lines */}
        <div className="space-y-1.5 mb-1">
          <div className="h-1.5 w-full bg-[#E2E6F3] rounded-full" />
          <div className="h-1.5 w-4/5 bg-[#E2E6F3] rounded-full" />
          <div className="h-1.5 w-2/3 bg-[#E2E6F3] rounded-full" />
        </div>
      </div>

      {/* Right tilted document card */}
      <div
        className="w-20 h-24 bg-white rounded-xl shadow-[0_10px_25px_rgba(39,35,212,0.08)] border border-[#F0F1F7] absolute right-4 top-7 rotate-12 p-2.5 flex flex-col justify-between"
      >
        {/* Purple-accented face */}
        <div className="flex flex-col items-center mt-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-1 border-t-2 border-[#6C5CE7] rounded-t-full" />
            <span className="w-2 h-1 border-t-2 border-[#6C5CE7] rounded-t-full" />
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <span className="w-1.5 h-1 rounded-full bg-[#E2E6F3]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#5B47E0]" />
            <span className="w-1.5 h-1 rounded-full bg-[#E2E6F3]" />
          </div>
        </div>
        {/* Mini grid table */}
        <div className="grid grid-cols-3 gap-1 border border-[#E2E6F3] rounded p-1 mb-1">
          <div className="h-2 bg-[#EEF0F8] rounded-[2px]" />
          <div className="h-2 bg-[#EEF0F8] rounded-[2px]" />
          <div className="h-2 bg-[#EEF0F8] rounded-[2px]" />
          <div className="h-2 bg-[#EEF0F8] rounded-[2px]" />
          <div className="h-2 bg-[#EEF0F8] rounded-[2px]" />
          <div className="h-2 bg-[#EEF0F8] rounded-[2px]" />
        </div>
      </div>

      {/* Center foreground document card */}
      <div
        className="w-22 h-26 bg-white rounded-xl shadow-[0_14px_30px_rgba(39,35,212,0.12)] border border-[#F0F1F7] relative z-10 top-2 p-3 flex flex-col justify-between"
      >
        {/* Pink-accented face */}
        <div className="flex flex-col items-center mt-1">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899]" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1 rounded-full bg-[#E2E6F3]" />
            <span className="w-2.5 h-1.5 rounded-b-full bg-[#EC4899]" />
            <span className="w-1.5 h-1 rounded-full bg-[#E2E6F3]" />
          </div>
        </div>
        {/* "A" + lines */}
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#98A0B8] leading-none">ID</span>
            <div className="h-1.5 flex-1 bg-[#E2E6F3] rounded-full" />
          </div>
          <div className="h-1.5 w-full bg-[#E2E6F3] rounded-full" />
          <div className="h-1.5 w-3/4 bg-[#E2E6F3] rounded-full" />
        </div>
      </div>

      {/* Bottom overlapping gradient circle button */}
      <div
        className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#3B33E4] via-[#7B5BF7] to-[#E285FA] shadow-[0_10px_22px_rgba(110,72,245,0.45)] flex items-center justify-center text-white absolute bottom-2 left-1/2 -translate-x-1/2 z-20"
      >
        {mode === 'success' ? (
          <Check className="w-6 h-6 stroke-[2.5]" />
        ) : (
          <Plus className="w-6 h-6 stroke-[2.5]" />
        )}
      </div>
    </div>
  );
};
