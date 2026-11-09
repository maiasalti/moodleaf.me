"use client";

import { useState } from "react";
import UserMenu from "./UserMenu";
import AuthModal from "./AuthModal";
import ThemeToggle from "./ThemeToggle";

export default function Hero() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 pt-5 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.png" alt="" className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-bold leading-none tracking-tight text-green-900 md:text-4xl">
              Moodleaf
            </h1>
            <p className="mt-1 truncate text-xs text-stone-500 md:text-sm">
              Find your next favorite book — set your mood below
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 lg:inline">
            Beta — feedback welcome (bottom left)
          </span>
          <ThemeToggle />
          <UserMenu onSignInClick={() => setShowAuth(true)} />
        </div>
      </header>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
