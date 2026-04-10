"use client";

import { SliderValues, TraitKey } from "@/lib/types";
import { SLIDER_DIMENSIONS, DEFAULT_SLIDER_VALUES, MAIN_TRAIT_KEYS, OPTIONAL_TRAIT_KEYS } from "@/lib/constants";
import Slider from "./Slider";

interface SliderPanelProps {
  values: SliderValues;
  lockedDimensions: Set<TraitKey>;
  enabledOptionalTraits: Set<TraitKey>;
  onChange: (key: TraitKey, value: number) => void;
  onToggleLock: (key: TraitKey) => void;
  onToggleOptionalTrait: (key: TraitKey) => void;
  onReset: () => void;
}

export default function SliderPanel({
  values,
  lockedDimensions,
  enabledOptionalTraits,
  onChange,
  onToggleLock,
  onToggleOptionalTrait,
  onReset,
}: SliderPanelProps) {
  const hasChanged =
    JSON.stringify(values) !== JSON.stringify(DEFAULT_SLIDER_VALUES) ||
    enabledOptionalTraits.size > 0;

  const mainDims = SLIDER_DIMENSIONS.filter((d) => MAIN_TRAIT_KEYS.includes(d.key));
  const optionalDims = SLIDER_DIMENSIONS.filter((d) => OPTIONAL_TRAIT_KEYS.includes(d.key));
  const enabledOptionalDims = optionalDims.filter((d) => enabledOptionalTraits.has(d.key));
  const disabledOptionalDims = optionalDims.filter((d) => !enabledOptionalTraits.has(d.key));

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

      {/* Main traits — always visible */}
      <div className="grid gap-3 sm:grid-cols-2">
        {mainDims.map((dim) => (
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

      {/* Enabled optional traits */}
      {enabledOptionalDims.length > 0 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {enabledOptionalDims.map((dim) => (
            <div key={dim.key} className="relative">
              <Slider
                dimension={dim}
                value={values[dim.key]}
                locked={lockedDimensions.has(dim.key)}
                onChange={(val) => onChange(dim.key, val)}
                onToggleLock={() => onToggleLock(dim.key)}
              />
              <button
                onClick={() => onToggleOptionalTrait(dim.key)}
                className="absolute top-2 right-2 text-[10px] text-stone-400 hover:text-red-500 transition-colors"
                title="Remove filter"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add optional trait buttons */}
      {disabledOptionalDims.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {disabledOptionalDims.map((dim) => (
            <button
              key={dim.key}
              onClick={() => onToggleOptionalTrait(dim.key)}
              className="rounded-full border border-dashed border-stone-300 bg-[var(--color-surface)]/70 px-3 py-1.5 text-xs font-medium text-stone-500 backdrop-blur-sm transition-all hover:border-green-700 hover:text-green-800"
            >
              + {dim.label}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-xs text-stone-400">
        Click <strong>!</strong> to lock a dimension as &ldquo;must
        match&rdquo;
      </p>
    </section>
  );
}
