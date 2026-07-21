import { useState, type FormEvent } from "react";
import { generatePdf } from "../services/pdf-api";
import type { PdfFormValues } from "../types/pdf";

const initialValues: PdfFormValues = {
  url: "",
  title: "",
  filename: "",
  maxPages: 10,
};

function normalizeUrl(value: string): string {
  const trimmedValue = value.trim();

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function validateValues(values: PdfFormValues): string {
  if (!values.url.trim()) {
    return "URL website wajib diisi.";
  }

  try {
    const url = new URL(normalizeUrl(values.url));

    if (!["http:", "https:"].includes(url.protocol)) {
      return "URL harus menggunakan HTTP atau HTTPS.";
    }
  } catch {
    return "Format URL website tidak valid.";
  }

  if (!values.title.trim()) {
    return "Judul PDF wajib diisi.";
  }

  if (!values.filename.trim()) {
    return "Nama file PDF wajib diisi.";
  }

  if (values.maxPages < 1 || values.maxPages > 20) {
    return "Jumlah halaman harus berada di antara 1 sampai 20.";
  }

  return "";
}

export default function PdfGeneratorForm() {
  const [values, setValues] = useState<PdfFormValues>(initialValues);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateValue<Key extends keyof PdfFormValues>(
    key: Key,
    value: PdfFormValues[Key],
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateValues(values);

    if (validationMessage) {
      setError(validationMessage);
      setSuccess("");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await generatePdf({
        ...values,
        url: normalizeUrl(values.url),
      });

      setSuccess(
        `${result.filename} berhasil dibuat dengan ${result.totalPages} halaman.`,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Terjadi kesalahan saat membuat file PDF.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/30 sm:p-8"
    >
      <div className="mb-7">
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">
          Buat PDF dari tampilan website
        </h2>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="website-url"
            className="mb-2 block text-sm font-semibold text-slate-200"
          >
            URL website
          </label>

          <input
            id="website-url"
            type="text"
            value={values.url}
            onChange={(event) => updateValue("url", event.target.value)}
            placeholder="https://www.rifqii.com/"
            autoComplete="url"
            disabled={isLoading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="pdf-title"
            className="mb-2 block text-sm font-semibold text-slate-200"
          >
            Judul pada header PDF
          </label>

          <input
            id="pdf-title"
            type="text"
            value={values.title}
            onChange={(event) => updateValue("title", event.target.value)}
            placeholder="Rifqi | Software Development"
            maxLength={120}
            disabled={isLoading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
          <div>
            <label
              htmlFor="pdf-filename"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              Nama file PDF
            </label>

            <input
              id="pdf-filename"
              type="text"
              value={values.filename}
              onChange={(event) => updateValue("filename", event.target.value)}
              placeholder="rifqi-portfolio.pdf"
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="maximum-pages"
              className="mb-2 block text-sm font-semibold text-slate-200"
            >
              Maksimal halaman
            </label>

            <input
              id="maximum-pages"
              type="number"
              min={1}
              max={20}
              value={values.maxPages}
              onChange={(event) =>
                updateValue("maxPages", Number(event.target.value))
              }
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-blue-800 disabled:text-blue-300"
      >
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Mengambil screenshot dan membuat PDF...
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M7 3h7l4 4v14H7z" />
              <path d="M14 3v5h5M9.5 13h5M9.5 17h5" />
            </svg>
            Generate dan Unduh PDF
          </>
        )}
      </button>

      <div aria-live="polite" className="mt-4 min-h-6">
        {error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
            {success}
          </p>
        )}
      </div>
    </form>
  );
}
