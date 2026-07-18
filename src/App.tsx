import PdfGeneratorForm from "./components/PdfGeneratorForm";

const processSteps = [
  {
    number: "01",
    title: "Membuka website",
    description:
      "Chromium membuka URL dengan viewport 1440 × 900 dan tema gelap.",
  },
  {
    number: "02",
    title: "Mengambil screenshot",
    description:
      "Halaman digulir bertahap dengan overlap 100 piksel agar bagian website tidak terlewat.",
  },
  {
    number: "03",
    title: "Menyusun PDF",
    description:
      "Setiap PNG dimasukkan ke PDF bersama tanggal, judul, URL, dan nomor halaman.",
  },
];

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_38%)]" />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
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
            Website Screenshot to PDF
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            Versi antarmuka dari program PDF pada repository, dengan proses
            screenshot bertahap dan penyusunan PDF menggunakan pdf-lib.
          </p>
        </header>

        <section className="mx-auto mt-10 max-w-3xl">
          <PdfGeneratorForm />
        </section>

        <section className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {processSteps.map((step) => (
            <article
              key={step.number}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur"
            >
              <span className="text-xs font-bold tracking-widest text-blue-400">
                {step.number}
              </span>

              <h2 className="mt-3 text-sm font-bold text-white">
                {step.title}
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                {step.description}
              </p>
            </article>
          ))}
        </section>

        <footer className="mt-10 text-center text-xs text-slate-600">
          React, TypeScript, Tailwind CSS, Express, Playwright, dan pdf-lib
        </footer>
      </main>
    </div>
  );
}
