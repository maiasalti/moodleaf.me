export default function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white/40 px-6 py-8 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center">
        <span className="font-serif text-xl font-bold text-green-900">
          Moodleaf
        </span>
        <div className="flex gap-6">
          <a
            href="https://instagram.com/moodleaf.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-stone-400 transition-colors hover:text-green-700"
          >
            Instagram
          </a>
          <a
            href="https://tiktok.com/@moodleaf.me"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-stone-400 transition-colors hover:text-green-700"
          >
            TikTok
          </a>
        </div>
        <p className="text-xs text-stone-400">
          Built by Maia Salti
        </p>
      </div>
    </footer>
  );
}
