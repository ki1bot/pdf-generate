import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { chromium } from "playwright";
import { captureStyle } from "./capture-style.js";
import { validateResourceUrl, validateTargetUrl } from "./url-security.js";
const viewportWidth = 1440;
const viewportHeight = 900;
const overlap = 100;
const headerHeight = 44;
const footerHeight = 34;
const maximumWarmUpHeight = 12000;
async function timeoutPromise(promise, milliseconds, fallback) {
    let timeoutId;
    const timeout = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallback), milliseconds);
    });
    const result = await Promise.race([promise, timeout]);
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    return result;
}
async function getPageHeight(page) {
    return page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight));
}
async function forceImagesToLoad(page) {
    await page.evaluate(() => {
        const images = Array.from(document.images);
        images.forEach((image) => {
            image.loading = "eager";
            if (image.dataset.src && !image.src) {
                image.src = image.dataset.src;
            }
            if (image.dataset.srcset && !image.srcset) {
                image.srcset = image.dataset.srcset;
            }
        });
    });
}
async function waitForFontsOnly(page) {
    await timeoutPromise(page.evaluate(async () => {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }
        return true;
    }), 3000, false);
}
async function prepareBeforeLoad(page) {
    await page.addInitScript({
        content: `
      window.IntersectionObserver = class {
        constructor(callback) {
          this.callback = callback;
        }

        observe(element) {
          const rect = element.getBoundingClientRect();

          this.callback(
            [
              {
                target: element,
                isIntersecting: true,
                intersectionRatio: 1,
                boundingClientRect: rect,
                intersectionRect: rect,
                rootBounds: document.documentElement.getBoundingClientRect(),
                time: performance.now(),
              },
            ],
            this,
          );
        }

        unobserve() {}
        disconnect() {}
        takeRecords() {
          return [];
        }
      };
    `,
    });
}
async function prepareAfterLoad(page) {
    await page.addStyleTag({
        content: captureStyle,
    });
}
async function warmUpScroll(page) {
    let height = await getPageHeight(page);
    const step = Math.floor(viewportHeight * 0.6);
    for (let y = 0; y <= height && y <= maximumWarmUpHeight; y += step) {
        await page.evaluate((position) => {
            window.scrollTo(0, position);
            window.dispatchEvent(new Event("scroll"));
        }, y);
        await page.waitForTimeout(350);
        await forceImagesToLoad(page);
        const newHeight = await getPageHeight(page);
        if (newHeight > height) {
            height = newHeight;
        }
    }
    await page.evaluate(() => {
        window.scrollTo(0, 0);
        window.dispatchEvent(new Event("scroll"));
    });
    await page.waitForTimeout(700);
}
function getCapturePositions(height, maxPages) {
    const positions = [];
    const step = viewportHeight - overlap;
    const normalizedHeight = Math.max(height, 1);
    let y = 0;
    while (y < normalizedHeight && positions.length < maxPages) {
        positions.push(Math.round(y));
        y += step;
    }
    if (positions.length === 0) {
        positions.push(0);
    }
    const lastPosition = Math.max(normalizedHeight - viewportHeight, 0);
    const lastCapturedPosition = positions.at(-1) ?? 0;
    const minimumDistance = Math.floor(viewportHeight * 0.5);
    if (positions.length < maxPages &&
        !positions.includes(lastPosition) &&
        Math.abs(lastPosition - lastCapturedPosition) >= minimumDistance) {
        positions.push(Math.round(lastPosition));
    }
    return [...new Set(positions)].slice(0, maxPages);
}
function getHeaderDate() {
    return new Intl.DateTimeFormat("en-US", {
        month: "numeric",
        day: "numeric",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        hourCycle: "h23",
    }).format(new Date());
}
function sanitizePdfText(value) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\x20-\x7E]/g, "?");
}
function truncateText(font, text, size, maxWidth) {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) {
        return text;
    }
    const suffix = "...";
    let shortened = text;
    while (shortened.length > 0 &&
        font.widthOfTextAtSize(`${shortened}${suffix}`, size) > maxWidth) {
        shortened = shortened.slice(0, -1);
    }
    return `${shortened}${suffix}`;
}
async function addImageToPdf(pdfDocument, font, imageBuffer, pageNumber, totalPages, title, url, headerDate) {
    const image = await pdfDocument.embedPng(imageBuffer);
    const pageWidth = viewportWidth;
    const pageHeight = viewportHeight + headerHeight + footerHeight;
    const pdfPage = pdfDocument.addPage([pageWidth, pageHeight]);
    const fontSize = 12;
    const textColor = rgb(0, 0, 0);
    const safeDate = sanitizePdfText(headerDate);
    const safeTitle = truncateText(font, sanitizePdfText(title), fontSize, pageWidth * 0.45);
    const safeUrl = truncateText(font, sanitizePdfText(url), fontSize, pageWidth * 0.78);
    const pageText = `${pageNumber}/${totalPages}`;
    const titleWidth = font.widthOfTextAtSize(safeTitle, fontSize);
    const pageTextWidth = font.widthOfTextAtSize(pageText, fontSize);
    pdfPage.drawText(safeDate, {
        x: 28,
        y: pageHeight - 24,
        size: fontSize,
        font,
        color: textColor,
    });
    pdfPage.drawText(safeTitle, {
        x: (pageWidth - titleWidth) / 2,
        y: pageHeight - 24,
        size: fontSize,
        font,
        color: textColor,
    });
    pdfPage.drawImage(image, {
        x: 0,
        y: footerHeight,
        width: viewportWidth,
        height: viewportHeight,
    });
    pdfPage.drawText(safeUrl, {
        x: 28,
        y: 12,
        size: fontSize,
        font,
        color: textColor,
    });
    pdfPage.drawText(pageText, {
        x: pageWidth - pageTextWidth - 28,
        y: 12,
        size: fontSize,
        font,
        color: textColor,
    });
}
function normalizeTitle(title) {
    const value = title.trim();
    if (!value) {
        return "Website PDF";
    }
    return value.slice(0, 120);
}
function normalizeFilename(filename, url) {
    const fallback = `${url.hostname.replace(/^www\./, "")}.pdf`;
    const value = filename.trim() || fallback;
    const withExtension = value.toLowerCase().endsWith(".pdf")
        ? value
        : `${value}.pdf`;
    const safeFilename = withExtension
        .replace(/[^a-z0-9._-]/gi, "-")
        .replace(/-+/g, "-")
        .replace(/^[-.]+|[-.]+$/g, "");
    return safeFilename || "website.pdf";
}
function normalizeMaxPages(maxPages) {
    if (!Number.isFinite(maxPages)) {
        return 10;
    }
    return Math.min(Math.max(Math.trunc(maxPages), 1), 20);
}
export async function generateWebsitePdf(options) {
    const targetUrl = await validateTargetUrl(options.url);
    const title = normalizeTitle(options.title);
    const filename = normalizeFilename(options.filename, targetUrl);
    const maxPages = normalizeMaxPages(options.maxPages);
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "pdf-generate-rifqi-"));
    let browser;
    try {
        browser = await chromium.launch({
            headless: true,
            args: ["--force-color-profile=srgb"],
            ...(executablePath ? { executablePath } : {}),
        });
        const context = await browser.newContext({
            viewport: {
                width: viewportWidth,
                height: viewportHeight,
            },
            screen: {
                width: viewportWidth,
                height: viewportHeight,
            },
            deviceScaleFactor: 1,
            colorScheme: "dark",
            reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const hostnameCache = new Map();
        page.setDefaultTimeout(10000);
        page.setDefaultNavigationTimeout(60000);
        await page.route("**/*", async (route) => {
            try {
                await validateResourceUrl(route.request().url(), hostnameCache);
                await route.continue();
            }
            catch {
                await route.abort("blockedbyclient");
            }
        });
        await prepareBeforeLoad(page);
        const response = await page.goto(targetUrl.href, {
            waitUntil: "domcontentloaded",
            timeout: 60000,
        });
        if (!response) {
            throw new Error("Website tidak memberikan respons.");
        }
        if (response.status() >= 400) {
            throw new Error(`Website mengembalikan status HTTP ${response.status()}.`);
        }
        await page
            .waitForLoadState("networkidle", {
            timeout: 7000,
        })
            .catch(() => undefined);
        await prepareAfterLoad(page);
        await waitForFontsOnly(page);
        await forceImagesToLoad(page);
        await warmUpScroll(page);
        const pageHeight = await getPageHeight(page);
        const positions = getCapturePositions(pageHeight, maxPages);
        const pdfDocument = await PDFDocument.create();
        const font = await pdfDocument.embedFont(StandardFonts.Helvetica);
        const headerDate = getHeaderDate();
        pdfDocument.setTitle(sanitizePdfText(title));
        pdfDocument.setAuthor("PDF Generate Rifqi");
        pdfDocument.setSubject(sanitizePdfText(targetUrl.href));
        pdfDocument.setCreator("Playwright dan pdf-lib");
        pdfDocument.setProducer("PDF Generate Rifqi");
        for (let index = 0; index < positions.length; index += 1) {
            const position = positions[index];
            await page.evaluate((scrollPosition) => {
                window.scrollTo(0, scrollPosition);
                window.dispatchEvent(new Event("scroll"));
            }, position);
            await page.waitForTimeout(700);
            await forceImagesToLoad(page);
            const imageBuffer = await page.screenshot({
                type: "png",
                fullPage: false,
                animations: "disabled",
                caret: "hide",
                omitBackground: false,
            });
            const screenshotPath = path.join(temporaryDirectory, `page-${String(index + 1).padStart(2, "0")}.png`);
            await writeFile(screenshotPath, imageBuffer);
            await addImageToPdf(pdfDocument, font, imageBuffer, index + 1, positions.length, title, targetUrl.href, headerDate);
        }
        const pdfBytes = await pdfDocument.save();
        await context.close();
        return {
            buffer: Buffer.from(pdfBytes),
            filename,
            totalPages: positions.length,
            pageHeight,
        };
    }
    finally {
        await browser?.close();
        await rm(temporaryDirectory, {
            recursive: true,
            force: true,
        });
    }
}
//# sourceMappingURL=pdf-service.js.map