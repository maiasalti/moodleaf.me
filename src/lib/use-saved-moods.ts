"use client";

import { useState, useEffect, useCallback } from "react";
import { SliderValues } from "./types";

export interface SavedMood {
  id: string;
  name: string;
  values: SliderValues;
  createdAt: string;
}

const STORAGE_KEY = "moodleaf-saved-moods";

export function useSavedMoods() {
  const [savedMoods, setSavedMoods] = useState<SavedMood[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedMoods(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const persist = useCallback((moods: SavedMood[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(moods));
  }, []);

  const saveMood = useCallback(
    (name: string, values: SliderValues) => {
      const mood: SavedMood = {
        id: crypto.randomUUID(),
        name,
        values,
        createdAt: new Date().toISOString(),
      };
      setSavedMoods((prev) => {
        const next = [...prev, mood];
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const deleteMood = useCallback(
    (id: string) => {
      setSavedMoods((prev) => {
        const next = prev.filter((m) => m.id !== id);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  return { savedMoods, saveMood, deleteMood };
}
