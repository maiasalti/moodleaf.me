"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getAllFeedback, Feedback } from "@/lib/feedback";
import Link from "next/link";

const ADMIN_EMAIL = "maia.salti@gmail.com";

export default function AdminFeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.email !== ADMIN_EMAIL) {
      setLoading(false);
      return;
    }
    getAllFeedback().then((data) => {
      setFeedback(data);
      setLoading(false);
    });
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-32 animate-pulse rounded bg-stone-200" />
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-green-900">Not authorized</h1>
        <p className="mt-3 text-stone-500">This page is admin-only.</p>
        <Link
          href="/"
          className="mt-6 rounded-lg bg-green-800 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 pt-6 md:px-10">
        <Link href="/" className="font-serif text-xl font-bold text-green-900 transition-colors hover:text-green-700">
          Moodleaf
        </Link>
      </header>

      <section className="mx-auto w-full max-w-3xl px-6 pt-12 pb-16">
        <h1 className="text-center font-serif text-3xl font-bold text-green-900">
          Feedback inbox
        </h1>
        <p className="mt-2 text-center text-sm text-stone-400">
          {feedback.length === 0
            ? "No feedback yet."
            : `${feedback.length} message${feedback.length === 1 ? "" : "s"}`}
        </p>

        <div className="mt-10 space-y-4">
          {feedback.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-stone-200 bg-[var(--color-surface)]/60 p-5 backdrop-blur-sm"
            >
              <div className="mb-3 flex items-center justify-between text-xs text-stone-400">
                <span>
                  {f.user_email ? (
                    <span className="font-medium text-green-800">{f.user_email}</span>
                  ) : (
                    <span className="italic">Anonymous</span>
                  )}
                </span>
                <span>
                  {new Date(f.created_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                {f.message}
              </p>
              {f.page_url && (
                <p className="mt-3 text-[10px] text-stone-400">
                  From: <span className="font-mono">{f.page_url}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
