import PdfGeneratorForm from "./components/PdfGeneratorForm";
import ProfileMenu from "./components/ProfileMenu";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_38%)]" />

      <ProfileMenu />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-12 pt-24 sm:px-6 sm:py-16 lg:px-8">
        <header className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300 shadow-xl shadow-blue-950/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="14" rx="2" />
              <path d="m7 14 3-3 2 2 2-2 3 3M8 21h8" />
            </svg>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Website to PDF
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Konversikan halaman website menjadi PDF melalui proses screenshot
            bertahap, lalu susun hasilnya secara otomatis.
          </p>
        </header>

        <section className="mx-auto mt-10 max-w-3xl">
          <PdfGeneratorForm />
        </section>

        <footer className="mt-10 text-center text-xs text-white">
          <p>© {new Date().getFullYear()} Kibot. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
