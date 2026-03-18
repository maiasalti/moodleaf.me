"use client";

export default function Hero() {
  return (
    <section className="flex flex-col items-center px-6 pt-16 pb-12 text-center md:pt-24 md:pb-16">
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
  );
}
