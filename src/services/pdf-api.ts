import type { PdfFormValues } from "../types/pdf";

function getFilename(response: Response) {
  const disposition = response.headers.get("Content-Disposition");

  const match = disposition?.match(/filename="?([^";]+)"?/i);

  return match?.[1] ?? "website.pdf";
}

async function getErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as {
      message?: string;
    };

    return data.message ?? "Gagal membuat file PDF.";
  } catch {
    return "Gagal membuat file PDF.";
  }
}

export async function generatePdf(values: PdfFormValues) {
  const response = await fetch("/api/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const blob = await response.blob();
  const filename = getFilename(response);

  const totalPages = Number(response.headers.get("X-PDF-Total-Pages")) || 0;

  const downloadUrl = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);

  return {
    filename,
    totalPages,
  };
}
