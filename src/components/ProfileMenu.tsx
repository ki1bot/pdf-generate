import { useEffect, useRef, useState } from "react";

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);

      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={menuRef} className="fixed right-3 top-3 z-50 sm:right-5 sm:top-5">
      <button
        type="button"
        className="flex h-11 w-11 touch-manipulation items-center justify-center rounded-full border border-slate-700 bg-slate-900 shadow-xl shadow-black/30 transition hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
        aria-label="Buka informasi pembuat"
        aria-controls="profile-menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <img
          src="/icons/profileWhite.png"
          alt=""
          className="h-8 w-8 object-contain"
        />
      </button>

      <div
        id="profile-menu"
        role="menu"
        aria-hidden={!isOpen}
        className={`absolute right-0 top-14 w-56 origin-top-right rounded-2xl border border-slate-700 bg-slate-900 p-3 text-white shadow-2xl shadow-black/40 transition-all duration-150 ${
          isOpen
            ? "visible translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible -translate-y-2 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-800">
            <img
              src="/icons/profileWhite.png"
              alt="Profil Kibot"
              className="h-8 w-8 object-contain"
            />
          </div>

          <div className="min-w-0">
            <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
              Created by
            </span>

            <strong className="mt-0.5 block truncate text-sm font-bold text-white">
              Kibot
            </strong>
          </div>
        </div>

        <a
          href="https://github.com/ki1bot"
          target="_blank"
          rel="noopener noreferrer"
          role="menuitem"
          className="mt-3 flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Buka akun GitHub Kibot"
          onClick={() => setIsOpen(false)}
        >
          <img
            src="/icons/githubWhite.png"
            alt=""
            className="h-5 w-5 object-contain"
          />

          <span>GitHub</span>
        </a>
      </div>
    </div>
  );
}
