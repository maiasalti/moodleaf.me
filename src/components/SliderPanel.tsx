"use client";

import { useState } from "react";
import { SliderValues, TraitKey, SliderDimension } from "@/lib/types";
import { SLIDER_DIMENSIONS, DEFAULT_SLIDER_VALUES, MAIN_TRAIT_KEYS } from "@/lib/constants";
import Slider from "./Slider";

interface SliderPanelProps {
  values: SliderValues;
  lockedDimensions: Set<TraitKey>;
  dismissedTraits: Set<TraitKey>;
  onChange: (key: TraitKey, value: number) => void;
  onToggleLock: (key: TraitKey) => void;
  onToggleTrait: (key: TraitKey) => void;
  onReset: () => void;
  onMatchBook?: () => void;
  bookSearch?: React.ReactNode;
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
  dismissedTraits,
  onChange,
  onToggleLock,
  onToggleTrait,
  onReset,
  onMatchBook,
  bookSearch,
}: SliderPanelProps) {
  const [infoDimension, setInfoDimension] = useState<SliderDimension | null>(null);

  const defaultExcluded = SLIDER_DIMENSIONS.filter((d) => !MAIN_TRAIT_KEYS.includes(d.key)).map((d) => d.key);
  const hasChanged =
    JSON.stringify(values) !== JSON.stringify(DEFAULT_SLIDER_VALUES) ||
    lockedDimensions.size > 0 ||
    dismissedTraits.size !== defaultExcluded.length ||
    defaultExcluded.some((k) => !dismissedTraits.has(k));

  return (
    <section className="mx-auto w-full max-w-6xl px-6">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        {SLIDER_DIMENSIONS.map((dim) => (
          <Slider
            key={dim.key}
            dimension={dim}
            value={values[dim.key]}
            included={!dismissedTraits.has(dim.key)}
            locked={lockedDimensions.has(dim.key)}
            onChange={(val) => onChange(dim.key, val)}
            onToggleLock={() => onToggleLock(dim.key)}
            onInfoClick={() => setInfoDimension(dim)}
            onToggleIncluded={() => onToggleTrait(dim.key)}
          />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {onMatchBook && (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:flex-nowrap">
            <button
              onClick={onMatchBook}
              className="flex shrink-0 items-center gap-2 rounded-full bg-green-800 px-4 py-2 text-sm font-semibold text-on-accent shadow-sm transition-all hover:bg-green-900 hover:shadow-md"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
                <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
              </svg>
              Match based on a book
            </button>
            {bookSearch && <div className="w-full max-w-md sm:w-auto sm:flex-1">{bookSearch}</div>}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!bookSearch && (
            <span className="text-xs text-stone-400">
              Dashed traits are ignored. Use the eye to include one, or just move its slider. The padlock makes a trait a must-match.
            </span>
          )}
          {hasChanged && (
            <button
              onClick={onReset}
              className="shrink-0 px-2 py-1.5 text-xs text-stone-400 transition-colors hover:text-stone-600"
            >
              Reset all
            </button>
          )}
        </div>
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
