"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { submitFeedback } from "@/lib/feedback";

export default function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    const success = await submitFeedback(
      message.trim(),
      user?.id ?? null,
      user?.email ?? null,
      typeof window !== "undefined" ? window.location.pathname : ""
    );
    setSubmitting(false);
    if (success) {
      setSubmitted(true);
      setMessage("");
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
      }, 1500);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-green-800 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:bg-green-900 hover:shadow-xl"
        title="Send feedback"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Feedback
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-start p-4 sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl bg-cream p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/80 text-stone-500 transition-colors hover:bg-stone-300 hover:text-stone-700"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="font-serif text-xl font-semibold text-green-900">
              Send feedback
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              Found a bug? Have a suggestion? I&apos;d love to hear it.
            </p>

            {submitted ? (
              <div className="mt-6 rounded-lg bg-green-50 p-4 text-center">
                <p className="text-sm font-medium text-green-800">Thanks! Feedback received.</p>
              </div>
            ) : (
              <>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your feedback here..."
                  rows={5}
                  className="mt-4 w-full rounded-lg border border-stone-200 bg-white p-3 text-sm text-stone-700 placeholder-stone-400 outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitting}
                  className="mt-3 w-full rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-900 disabled:bg-stone-300 disabled:text-stone-500"
                >
                  {submitting ? "Sending..." : "Send feedback"}
                </button>
                {!user && (
                  <p className="mt-2 text-center text-xs text-stone-400">
                    Sign in to attach your email so I can follow up.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
