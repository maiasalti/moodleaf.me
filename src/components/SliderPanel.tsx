"use client";

import { useState } from "react";
import { SliderValues, TraitKey, SliderDimension } from "@/lib/types";
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
  onMatchBook?: () => void;
}

function TraitInfoModal({ dimension, onClose }: { dimension: SliderDimension; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl bg-cream p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-stone-200/80 text-stone-500 transition-colors hover:bg-stone-300 hover:text-stone-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 className="font-serif text-lg font-semibold text-green-900 pr-8">
          {dimension.label}
        </h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
          <span>{dimension.lowLabel}</span>
          <span className="flex-1 border-t border-dashed border-stone-300" />
          <span>{dimension.highLabel}</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          {dimension.description}
        </p>
      </div>
    </div>
  );
}

export default function SliderPanel({
  values,
  lockedDimensions,
  enabledOptionalTraits,
  onChange,
  onToggleLock,
  onToggleOptionalTrait,
  onReset,
  onMatchBook,
}: SliderPanelProps) {
  const [infoDimension, setInfoDimension] = useState<SliderDimension | null>(null);

  const hasChanged =
    JSON.stringify(values) !== JSON.stringify(DEFAULT_SLIDER_VALUES) ||
    enabledOptionalTraits.size > 0;

  const mainDims = SLIDER_DIMENSIONS.filter((d) => MAIN_TRAIT_KEYS.includes(d.key));
  const optionalDims = SLIDER_DIMENSIONS.filter((d) => OPTIONAL_TRAIT_KEYS.includes(d.key));
  const enabledOptionalDims = optionalDims.filter((d) => enabledOptionalTraits.has(d.key));
  const disabledOptionalDims = optionalDims.filter((d) => !enabledOptionalTraits.has(d.key));
  const allActiveDims = [...mainDims, ...enabledOptionalDims];

  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      {/* All active sliders (main + enabled optional) in one row-wrapping grid */}
      <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {allActiveDims.map((dim) => {
          const isOptional = OPTIONAL_TRAIT_KEYS.includes(dim.key);
          return (
            <div key={dim.key} className="relative">
              <Slider
                dimension={dim}
                value={values[dim.key]}
                locked={lockedDimensions.has(dim.key)}
                onChange={(val) => onChange(dim.key, val)}
                onToggleLock={() => onToggleLock(dim.key)}
                onInfoClick={() => setInfoDimension(dim)}
              />
              {isOptional && (
                <button
                  onClick={() => onToggleOptionalTrait(dim.key)}
                  className="absolute top-2 right-2 text-[10px] text-stone-400 hover:text-red-500 transition-colors"
                  title="Remove filter"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Optional traits, match-a-book, reset */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
          {disabledOptionalDims.map((dim) => (
            <button
              key={dim.key}
              onClick={() => onToggleOptionalTrait(dim.key)}
              className="rounded-full border border-dashed border-stone-300 bg-[var(--color-surface)]/70 px-3 py-1.5 text-xs font-medium text-stone-500 backdrop-blur-sm transition-all hover:border-green-700 hover:text-green-800"
            >
              + {dim.label}
            </button>
          ))}
          {onMatchBook && (
            <button
              onClick={onMatchBook}
              className="rounded-full border border-stone-200 bg-[var(--color-surface)]/70 px-3 py-1.5 text-xs font-medium text-stone-600 backdrop-blur-sm transition-all hover:border-green-700 hover:bg-green-50 hover:text-green-800"
            >
              Match a book
            </button>
          )}
          {hasChanged && (
            <button
              onClick={onReset}
              className="px-2 py-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
            >
              Reset all
            </button>
          )}
          <span className="ml-auto hidden text-xs text-stone-400 md:inline">
            Tap a trait name to learn what it measures · <strong>!</strong> locks it as &ldquo;must match&rdquo;
          </span>
      </div>

      {infoDimension && (
        <TraitInfoModal
          dimension={infoDimension}
          onClose={() => setInfoDimension(null)}
        />
      )}
    </section>
  );
}
