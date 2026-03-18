"use client";

import { SliderValues, TraitKey } from "@/lib/types";
import { SLIDER_DIMENSIONS, DEFAULT_SLIDER_VALUES } from "@/lib/constants";
import Slider from "./Slider";

interface SliderPanelProps {
  values: SliderValues;
  lockedDimensions: Set<TraitKey>;
  onChange: (key: TraitKey, value: number) => void;
  onToggleLock: (key: TraitKey) => void;
  onReset: () => void;
}

export default function SliderPanel({
  values,
  lockedDimensions,
  onChange,
  onToggleLock,
  onReset,
}: SliderPanelProps) {
  const hasChanged =
    JSON.stringify(values) !== JSON.stringify(DEFAULT_SLIDER_VALUES);

  return (
    <section className="mx-auto w-full max-w-2xl px-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-green-900">
          Set your mood
        </h2>
        {hasChanged && (
          <button
            onClick={onReset}
            className="text-sm text-stone-400 transition-colors hover:text-stone-600"
          >
            Reset all
          </button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SLIDER_DIMENSIONS.map((dim) => (
          <Slider
            key={dim.key}
            dimension={dim}
            value={values[dim.key]}
            locked={lockedDimensions.has(dim.key)}
            onChange={(val) => onChange(dim.key, val)}
            onToggleLock={() => onToggleLock(dim.key)}
          />
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-stone-400">
        Click <strong>!</strong> to lock a dimension as &ldquo;must
        match&rdquo;
      </p>
    </section>
  );
}
