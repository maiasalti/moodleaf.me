"use client";

import { useRef, useCallback, useState } from "react";
import { SliderValues, TraitKey } from "./types";
import { TRAIT_KEYS } from "./constants";

export function useAnimatedSliders(
  currentValues: SliderValues,
  setSliderValues: (values: SliderValues) => void
) {
  const animFrameRef = useRef<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const setSliderValuesAnimated = useCallback(
    (target: SliderValues) => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }

      const start = { ...currentValues };
      const startTime = performance.now();
      const duration = 400;

      setIsAnimating(true);

      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const next: Partial<SliderValues> = {};
        let allDone = true;

        for (const key of TRAIT_KEYS) {
          const from = start[key as TraitKey];
          const to = target[key as TraitKey];
          const current = Math.round(from + (to - from) * progress);
          next[key as TraitKey] = current;
          if (current !== to) allDone = false;
        }

        setSliderValues(next as SliderValues);

        if (allDone || progress >= 1) {
          setSliderValues(target);
          setIsAnimating(false);
          animFrameRef.current = 0;
        } else {
          animFrameRef.current = requestAnimationFrame(step);
        }
      }

      animFrameRef.current = requestAnimationFrame(step);
    },
    [currentValues, setSliderValues]
  );

  return { setSliderValuesAnimated, isAnimating };
}
