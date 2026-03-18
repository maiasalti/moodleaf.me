"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

interface UserMenuProps {
  onSignInClick: () => void;
}

export default function UserMenu({ onSignInClick }: UserMenuProps) {
  const { user, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
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

  if (loading) return null;

  if (!user) {
    return (
      <button
        onClick={onSignInClick}
        className="rounded-lg border border-stone-200 bg-white/60 px-4 py-2 text-sm text-stone-600 backdrop-blur-sm transition-colors hover:border-stone-300 hover:bg-white/80"
      >
        Sign in
      </button>
    );
  }

  const displayName =
    user.user_metadata?.display_name || user.email?.split("@")[0] || "You";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-green-800 text-sm font-medium text-white transition-colors hover:bg-green-900"
        title={displayName}
      >
        {displayName.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-stone-200 bg-white/95 p-2 shadow-lg backdrop-blur-md">
          <p className="px-3 py-1.5 text-xs text-stone-400">
            Signed in as <strong className="text-stone-600">{displayName}</strong>
          </p>
          <Link
            href="/saved"
            onClick={() => setOpen(false)}
            className="block w-full rounded-lg px-3 py-1.5 text-left text-sm text-stone-600 transition-colors hover:bg-green-50"
          >
            Saved books
          </Link>
          <button
            onClick={() => { signOut(); setOpen(false); }}
            className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-stone-600 transition-colors hover:bg-stone-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
