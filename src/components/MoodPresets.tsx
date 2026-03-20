"use client";

import { SliderValues } from "@/lib/types";
import { MOOD_PRESETS } from "@/lib/constants";
import { SavedMood } from "@/lib/use-saved-moods";

interface MoodPresetsProps {
  onSelect: (values: SliderValues) => void;
  savedMoods?: SavedMood[];
  onDeleteMood?: (id: string) => void;
}

export default function MoodPresets({ onSelect, savedMoods = [], onDeleteMood }: MoodPresetsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {MOOD_PRESETS.map((preset) => (
        <button
          key={preset.name}
          onClick={() => onSelect(preset.values)}
          className="rounded-full border border-stone-200 bg-[var(--color-surface)]/70 px-4 py-2 text-sm font-medium text-stone-600 backdrop-blur-sm transition-all hover:border-green-700 hover:bg-green-50 hover:text-green-800"
        >
          <span className="mr-1.5">{preset.icon}</span>
          {preset.name}
        </button>
      ))}
      {savedMoods.map((mood) => (
        <div key={mood.id} className="group relative">
          <button
            onClick={() => onSelect(mood.values)}
            className="rounded-full border border-terracotta/30 bg-terracotta/5 px-4 py-2 text-sm font-medium text-terracotta backdrop-blur-sm transition-all hover:border-terracotta hover:bg-terracotta/10"
          >
            {mood.name}
          </button>
          {onDeleteMood && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteMood(mood.id); }}
              className="absolute -top-1.5 -right-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-stone-400 text-xs text-white transition-colors hover:bg-red-500 group-hover:flex"
              title="Delete mood"
            >
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
