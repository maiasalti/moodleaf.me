"use client";

import { SliderValues } from "@/lib/types";
import { MOOD_PRESETS } from "@/lib/constants";

interface MoodPresetsProps {
  onSelect: (values: SliderValues) => void;
}

export default function MoodPresets({ onSelect }: MoodPresetsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {MOOD_PRESETS.map((preset) => (
        <button
          key={preset.name}
          onClick={() => onSelect(preset.values)}
          className="rounded-full border border-stone-200 bg-white/70 px-4 py-2 text-sm font-medium text-stone-600 backdrop-blur-sm transition-all hover:border-green-700 hover:bg-green-50 hover:text-green-800"
        >
          <span className="mr-1.5">{preset.icon}</span>
          {preset.name}
        </button>
      ))}
    </div>
  );
}
