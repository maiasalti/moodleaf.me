"use client";

import { useState, useRef, useEffect } from "react";
import { ReadingListWithBooks } from "@/lib/types";

interface AddToListDropdownProps {
  bookId: string;
  lists: ReadingListWithBooks[];
  onAddToList: (listId: string, bookId: string) => void;
  onRemoveFromList: (listId: string, bookId: string) => void;
  onCreateList: (name: string) => void;
}

export default function AddToListDropdown({
  bookId,
  lists,
  onAddToList,
  onRemoveFromList,
  onCreateList,
}: AddToListDropdownProps) {
  const [open, setOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreate = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    onCreateList(trimmed);
    setNewListName("");
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full bg-stone-200 px-4 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-300"
      >
        Add to list
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-56 rounded-xl border border-stone-200 bg-[var(--color-surface-elevated)] p-2 shadow-lg backdrop-blur-md">
          {lists.length === 0 && (
            <p className="px-3 py-1.5 text-xs text-stone-400">No lists yet</p>
          )}
          {lists.map((list) => {
            const isInList = list.books.some((b) => b.id === bookId);
            return (
              <label
                key={list.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-stone-600 transition-colors hover:bg-green-50"
              >
                <input
                  type="checkbox"
                  checked={isInList}
                  onChange={() =>
                    isInList
                      ? onRemoveFromList(list.id, bookId)
                      : onAddToList(list.id, bookId)
                  }
                  className="h-4 w-4 rounded border-stone-300 text-green-700 accent-green-700"
                />
                {list.name}
                <span className="ml-auto text-xs text-stone-400">
                  {list.books.length}
                </span>
              </label>
            );
          })}
          <div className="mt-1 border-t border-stone-200 pt-1">
            <div className="flex items-center gap-1 px-1">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="New list..."
                className="flex-1 rounded-lg border border-stone-200 bg-transparent px-2 py-1 text-xs text-stone-600 outline-none focus:border-green-700"
              />
              <button
                onClick={handleCreate}
                disabled={!newListName.trim()}
                className="rounded-lg px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
