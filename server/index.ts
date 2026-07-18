import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { generateWebsitePdf } from "./pdf-service.js";
import { UrlValidationError } from "./url-security.js";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.disable("x-powered-by");

app.use(
  express.json({
    limit: "20kb",
  }),
);

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
  });
});

app.post("/api/pdf", async (request, response) => {
  const body = request.body as Record<string, unknown>;

  const url = typeof body.url === "string" ? body.url : "";

  const title = typeof body.title === "string" ? body.title : "";

  const filename = typeof body.filename === "string" ? body.filename : "";

  const maxPages =
    typeof body.maxPages === "number" ? body.maxPages : Number(body.maxPages);

  try {
    const pdf = await generateWebsitePdf({
      url,
      title,
      filename,
      maxPages,
    });

    response.setHeader("Content-Type", "application/pdf");

    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdf.filename}"`,
    );

    response.setHeader("Content-Length", pdf.buffer.byteLength.toString());

    response.setHeader("X-PDF-Total-Pages", pdf.totalPages.toString());

    response.setHeader("X-Website-Height", pdf.pageHeight.toString());

    response.setHeader("Cache-Control", "no-store");

    response.end(pdf.buffer);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat membuat file PDF.";

    const status = error instanceof UrlValidationError ? 400 : 500;

    response.status(status).json({
      message,
    });
  }
});

const distPath = path.resolve(process.cwd(), "dist");

if (process.env.NODE_ENV === "production" && existsSync(distPath)) {
  app.use(express.static(distPath));

  app.use((request, response, next) => {
    if (request.method === "GET" && !request.path.startsWith("/api/")) {
      response.sendFile(path.join(distPath, "index.html"));

      return;
    }

    next();
  });
}

app.use("/api", (_request, response) => {
  response.status(404).json({
    message: "Endpoint API tidak ditemukan.",
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
