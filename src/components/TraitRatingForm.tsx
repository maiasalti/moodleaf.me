"use client";

import { useState } from "react";
import { SliderValues } from "@/lib/types";
import { SLIDER_DIMENSIONS } from "@/lib/constants";

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

  function handleChange(key: keyof SliderValues, val: number) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <div className="space-y-3">
      {SLIDER_DIMENSIONS.map((dim) => {
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

      <button
        onClick={() => onSubmit(values)}
        className="w-full rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-900"
      >
        {isUpdate ? "Update rating" : "Submit rating"}
      </button>
    </div>
  );
}
