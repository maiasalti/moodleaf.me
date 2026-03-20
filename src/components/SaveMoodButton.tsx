"use client";

import { useState } from "react";
import { SliderValues } from "@/lib/types";

interface SaveMoodButtonProps {
  values: SliderValues;
  onSave: (name: string, values: SliderValues) => void;
}

export default function SaveMoodButton({ values, onSave }: SaveMoodButtonProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed, values);
    setName("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-full border border-dashed border-stone-300 bg-[var(--color-surface)]/70 px-4 py-2 text-sm font-medium text-stone-500 backdrop-blur-sm transition-all hover:border-green-700 hover:text-green-800"
      >
        + Save this mood
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder="Name this mood..."
        autoFocus
        className="rounded-lg border border-stone-200 bg-[var(--color-surface)] px-3 py-1.5 text-sm text-stone-700 outline-none transition-colors focus:border-green-700"
      />
      <button
        onClick={handleSave}
        disabled={!name.trim()}
        className="rounded-lg bg-green-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-900 disabled:opacity-40"
      >
        Save
      </button>
      <button
        onClick={() => { setEditing(false); setName(""); }}
        className="text-sm text-stone-400 hover:text-stone-600"
      >
        Cancel
      </button>
    </div>
  );
}
