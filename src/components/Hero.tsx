"use client";

import { useState } from "react";
import UserMenu from "./UserMenu";
import AuthModal from "./AuthModal";
import ThemeToggle from "./ThemeToggle";

export default function Hero() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between px-6 pt-6 md:px-10">
        <img src="/logo.png" alt="Moodleaf" className="h-10 w-10" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <UserMenu onSignInClick={() => setShowAuth(true)} />
        </div>
      </header>
      <section className="flex flex-col items-center px-6 pt-10 pb-12 text-center md:pt-16 md:pb-16">
        <p className="mb-4 rounded-full bg-red-50 px-4 py-1.5 text-xs font-medium text-red-600">
          Still in beta — we&apos;d love your feedback via the button in the bottom left
        </p>
        <h1 className="font-serif text-5xl font-bold tracking-tight text-green-900 md:text-7xl">
          Moodleaf
        </h1>
        <p className="mt-4 max-w-lg text-lg text-stone-600 md:text-xl">
          Find your next favorite book
        </p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-500 md:text-base">
          Adjust the sliders to match your reading mood, and we&apos;ll find the
          perfect books for you.
        </p>
      </section>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
