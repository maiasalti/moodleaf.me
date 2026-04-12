"use client";

import { SliderDimension } from "@/lib/types";

interface SliderProps {
  dimension: SliderDimension;
  value: number;
  locked: boolean;
  onChange: (value: number) => void;
  onToggleLock: () => void;
  onInfoClick?: () => void;
}

export default function Slider({
  dimension,
  value,
  locked,
  onChange,
  onToggleLock,
  onInfoClick,
}: SliderProps) {
  const percentage = ((value - 1) / 9) * 100;

  return (
    <div className="group flex flex-col gap-2 rounded-xl bg-[var(--color-surface)]/60 px-5 py-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <button
          onClick={onInfoClick}
          className="text-sm font-semibold text-green-900 underline decoration-dotted decoration-stone-300 underline-offset-2 hover:decoration-green-700 transition-colors"
          title={`What is ${dimension.label}?`}
        >
          {dimension.label}
        </button>
        <div className="flex items-center gap-2">
          <span className="min-w-[2ch] text-right font-mono text-sm font-medium text-stone-600">
            {value}
          </span>
          <button
            onClick={onToggleLock}
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-colors ${
              locked
                ? "bg-green-800 text-white"
                : "bg-stone-200 text-stone-400 hover:bg-stone-300"
            }`}
            title={locked ? "Unlock (nice to have)" : "Lock (must match)"}
            aria-label={
              locked
                ? `Unlock ${dimension.label}`
                : `Lock ${dimension.label}`
            }
          >
            {locked ? "!" : "~"}
          </button>
        </div>
      </div>

      <div className="relative flex items-center">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input w-full"
          style={
            {
              "--slider-percentage": `${percentage}%`,
            } as React.CSSProperties
          }
        />
      </div>

      <div className="flex justify-between">
        <span className="text-xs text-stone-400">{dimension.lowLabel}</span>
        <span className="text-xs text-stone-400">{dimension.highLabel}</span>
      </div>
    </div>
  );
}
