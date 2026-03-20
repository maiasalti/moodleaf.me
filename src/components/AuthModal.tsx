"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "signup") {
      const err = await signUp(email, password, displayName || email.split("@")[0]);
      if (err) {
        setError(err);
      } else {
        setCheckEmail(true);
      }
    } else {
      const err = await signIn(email, password);
      if (err) {
        setError(err);
      } else {
        onClose();
      }
    }
    setLoading(false);
  };

  if (checkEmail) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-elevated)] p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="font-serif text-2xl font-semibold text-green-900">Check your email</h2>
          <p className="mt-3 text-sm text-stone-500">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-lg bg-green-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface-elevated)] p-8 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-2xl font-semibold text-green-900">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-1 text-sm text-stone-400">
          {mode === "signin"
            ? "Sign in to access your saved books"
            : "Save books and get personalized recommendations"}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 outline-none transition-colors focus:border-green-700 focus:bg-[var(--color-surface)]"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 outline-none transition-colors focus:border-green-700 focus:bg-[var(--color-surface)]"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm text-stone-700 outline-none transition-colors focus:border-green-700 focus:bg-[var(--color-surface)]"
          />

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-green-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900 disabled:opacity-50"
          >
            {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-stone-400">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <button onClick={() => { setMode("signup"); setError(null); }} className="font-medium text-green-700 hover:text-green-900">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => { setMode("signin"); setError(null); }} className="font-medium text-green-700 hover:text-green-900">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
