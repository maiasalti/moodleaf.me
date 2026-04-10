"use client";

import { useState } from "react";
import { SliderValues, TraitKey } from "@/lib/types";
import { SLIDER_DIMENSIONS } from "@/lib/constants";

const REQUIRED_TRAITS: Set<TraitKey> = new Set(["pacing", "characterization", "plot_complexity"]);

interface TraitRatingFormProps {
  initialValues: SliderValues;
  isUpdate: boolean;
  onSubmit: (values: SliderValues) => void;
}

export default function TraitRatingForm({
  initialValues,
  isUpdate,
  onSubmit,
}: TraitRatingFormProps) {
  const [values, setValues] = useState<SliderValues>(initialValues);
  const [enabledOptional, setEnabledOptional] = useState<Set<TraitKey>>(() => {
    // If updating, enable all traits that have non-default values
    if (isUpdate) {
      return new Set(SLIDER_DIMENSIONS.map((d) => d.key));
    }
    return new Set<TraitKey>();
  });

  function handleChange(key: TraitKey, val: number) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function toggleOptional(key: TraitKey) {
    setEnabledOptional((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const requiredDims = SLIDER_DIMENSIONS.filter((d) => REQUIRED_TRAITS.has(d.key));
  const optionalDims = SLIDER_DIMENSIONS.filter((d) => !REQUIRED_TRAITS.has(d.key));

  return (
    <div className="space-y-4">
      {/* Required traits */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-green-800">Required</p>
        {requiredDims.map((dim) => {
          const val = values[dim.key];
          const percentage = ((val - 1) / 9) * 100;

          return (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">{dim.label}</span>
                <span className="font-mono text-sm font-medium text-stone-600">
                  {val}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={val}
                onChange={(e) => handleChange(dim.key, Number(e.target.value))}
                className="slider-input w-full"
                style={
                  {
                    "--slider-percentage": `${percentage}%`,
                  } as React.CSSProperties
                }
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-stone-400">
                  {dim.lowLabel}
                </span>
                <span className="text-[10px] text-stone-400">
                  {dim.highLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Optional traits */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-stone-400">Optional</p>
        {optionalDims.map((dim) => {
          const isEnabled = enabledOptional.has(dim.key);
          const val = values[dim.key];
          const percentage = ((val - 1) / 9) * 100;

          if (!isEnabled) {
            return (
              <button
                key={dim.key}
                onClick={() => toggleOptional(dim.key)}
                className="flex w-full items-center justify-between rounded-lg border border-dashed border-stone-300 px-3 py-2 text-sm text-stone-400 transition-colors hover:border-green-700 hover:text-green-800"
              >
                <span>+ {dim.label}</span>
              </button>
            );
          }

          return (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm text-stone-600">{dim.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-stone-600">
                    {val}
                  </span>
                  <button
                    onClick={() => toggleOptional(dim.key)}
                    className="text-[10px] text-stone-400 hover:text-red-500"
                  >
                    remove
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={val}
                onChange={(e) => handleChange(dim.key, Number(e.target.value))}
                className="slider-input w-full"
                style={
                  {
                    "--slider-percentage": `${percentage}%`,
                  } as React.CSSProperties
                }
              />
              <div className="flex justify-between">
                <span className="text-[10px] text-stone-400">
                  {dim.lowLabel}
                </span>
                <span className="text-[10px] text-stone-400">
                  {dim.highLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onSubmit(values)}
        className="w-full rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-900"
      >
        {isUpdate ? "Update rating" : "Submit rating"}
      </button>
    </div>
  );
}
