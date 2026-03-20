"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "moodleaf-hidden-books";

export function useHiddenBooks() {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHiddenIds(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  const persist = useCallback((ids: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  }, []);

  const hideBook = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev).add(id);
      persist(next);
      return next;
    });
  }, [persist]);

  const unhideBook = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      persist(next);
      return next;
    });
  }, [persist]);

  const clearHidden = useCallback(() => {
    setHiddenIds(new Set());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { hiddenIds, hideBook, unhideBook, clearHidden };
}
