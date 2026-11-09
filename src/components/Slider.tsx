"use client";

import { SliderDimension } from "@/lib/types";

interface SliderProps {
  dimension: SliderDimension;
  value: number;
  included: boolean;
  locked: boolean;
  onChange: (value: number) => void;
  onToggleLock: () => void;
  onInfoClick?: () => void;
  onToggleIncluded: () => void;
}

function PadlockIcon({ closed }: { closed: boolean }) {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      {closed ? <path d="M8 11V7a4 4 0 0 1 8 0v4" /> : <path d="M8 11V7a4 4 0 0 1 7.5-1.9" />}
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  );
}

export default function Slider({
  dimension,
  value,
  included,
  locked,
  onChange,
  onToggleLock,
  onInfoClick,
  onToggleIncluded,
}: SliderProps) {
  const percentage = ((value - 1) / 9) * 100;

  return (
    <div
      className={`group flex flex-col gap-1.5 rounded-xl border px-4 py-3 transition-[background-color,border-color,opacity] ${
        included
          ? "border-stone-200 bg-[var(--color-surface)] shadow-sm hover:shadow-md"
          : "border-dashed border-stone-300 bg-transparent"
      } ${locked ? "ring-1 ring-green-700/60" : ""}`}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onInfoClick}
          className={`min-w-0 truncate text-left text-sm font-semibold underline decoration-dotted decoration-stone-300 underline-offset-2 transition-colors hover:decoration-green-700 ${
            included ? "text-green-900" : "text-stone-400"
          }`}
          title={`What is ${dimension.label}?`}
        >
          {dimension.label}
        </button>
        <span className={`ml-auto text-sm font-semibold tabular-nums ${included ? "text-stone-600" : "text-stone-400"}`}>
          {value}
        </span>
        <button
          onClick={onToggleLock}
          className={`flex h-6 items-center gap-1 rounded-full px-1.5 text-[11px] font-semibold transition-colors ${
            locked
              ? "bg-green-800 text-on-accent"
              : "text-stone-400 hover:bg-stone-200 hover:text-stone-600"
          }`}
          title={locked ? "Must match: click to make it a preference" : "Require books to match this closely (±1.5)"}
          aria-pressed={locked}
          aria-label={locked ? `Unlock ${dimension.label}` : `Require ${dimension.label} to match`}
        >
          <PadlockIcon closed={locked} />
          {locked && <span>Must match</span>}
        </button>
        <button
          onClick={onToggleIncluded}
          className={`-mr-1 flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-stone-200 ${
            included ? "text-stone-500 hover:text-stone-700" : "text-stone-400 hover:text-green-800"
          }`}
          title={included ? `Ignore ${dimension.label} when matching` : `Include ${dimension.label} when matching`}
          aria-pressed={included}
          aria-label={included ? `Ignore ${dimension.label}` : `Include ${dimension.label}`}
        >
          <EyeIcon open={included} />
        </button>
      </div>

      <div className={`relative flex items-center transition-opacity ${included ? "" : "opacity-45"}`}>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input w-full"
          aria-label={dimension.label}
          style={{ "--slider-percentage": `${percentage}%` } as React.CSSProperties}
        />
      </div>

      <div className={`flex justify-between transition-opacity ${included ? "" : "opacity-60"}`}>
        <span className="text-xs text-stone-400">{dimension.lowLabel}</span>
        <span className="text-xs text-stone-400">{dimension.highLabel}</span>
      </div>
    </div>
  );
}
