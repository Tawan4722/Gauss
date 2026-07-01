import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb, degrees, type PDFPage } from "pdf-lib";

import type { Tool, ToolSettings } from "@/lib/tools/registry";

export type ToolOutput = {
  id: string;
  name: string;
  type: string;
  size: number;
  blob: Blob;
  message: string;
};

export type ToolProcessResult = {
  summary: string;
  outputs: ToolOutput[];
};

type ImageFormat = "Original" | "WebP" | "PNG" | "JPEG" | "AVIF";
type ResizeMode = "Keep size" | "Fit box" | "Exact size" | "Width only" | "Height only";
type ImageEffect = "None" | "Grayscale" | "Sepia" | "Invert";

const cleanName = (value: string) =>
  value.trim().replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "") || "gauss";
const extensionOf = (name: string) => (name.lastIndexOf(".") >= 0 ? name.slice(name.lastIndexOf(".") + 1).toLowerCase() : "");
const baseNameOf = (name: string) => cleanName(name.lastIndexOf(".") >= 0 ? name.slice(0, name.lastIndexOf(".")) : name);
const getString = (settings: ToolSettings, key: string, fallback = "") => String(settings[key] ?? fallback);
const getNumber = (settings: ToolSettings, key: string, fallback: number) => Number(settings[key] ?? fallback);
const getBoolean = (settings: ToolSettings, key: string, fallback: boolean) => Boolean(settings[key] ?? fallback);
const csvEscape = (value: string | number | boolean) => `"${String(value).replaceAll('"', '""')}"`;

const createOutput = async (name: string, blob: Blob, message: string): Promise<ToolOutput> => ({
  id: `${name}-${blob.size}-${crypto.randomUUID()}`,
  name,
  type: blob.type || "application/octet-stream",
  size: blob.size,
  blob,
  message,
});

const pdfBytesToBlob = (bytes: Uint8Array) => {
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([arrayBuffer], { type: "application/pdf" });
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));

const encodeCanvas = async (canvas: HTMLCanvasElement, format: Exclude<ImageFormat, "Original">, quality: number) => {
  const type = format === "JPEG" ? "image/jpeg" : format === "PNG" ? "image/png" : format === "AVIF" ? "image/avif" : "image/webp";
  const extension = format === "JPEG" ? "jpg" : format.toLowerCase();
  const blob = await canvasToBlob(canvas, type, quality / 100);
  if (blob && blob.type === type) return { blob, extension, label: format };

  const fallback = await canvasToBlob(canvas, "image/png");
  if (!fallback) throw new Error("Unable to encode image output in this browser.");
  return { blob: fallback, extension: "png", label: `${format} fallback PNG` };
};

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Unable to decode ${file.name}.`));
    };
    image.src = url;
  });

const getTargetSize = (sourceWidth: number, sourceHeight: number, mode: ResizeMode, width: number, height: number) => {
  if (mode === "Exact size") return { width, height };
  if (mode === "Width only") return { width, height: Math.max(1, Math.round((sourceHeight / sourceWidth) * width)) };
  if (mode === "Height only") return { width: Math.max(1, Math.round((sourceWidth / sourceHeight) * height)), height };
  if (mode === "Fit box") {
    const ratio = Math.min(width / sourceWidth, height / sourceHeight, 1);
    return { width: Math.max(1, Math.round(sourceWidth * ratio)), height: Math.max(1, Math.round(sourceHeight * ratio)) };
  }
  return { width: sourceWidth, height: sourceHeight };
};

const applyEffect = (canvas: HTMLCanvasElement, effect: ImageEffect) => {
  if (effect === "None") return;
  const context = canvas.getContext("2d");
  if (!context) return;

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const red = pixels.data[index];
    const green = pixels.data[index + 1];
    const blue = pixels.data[index + 2];

    if (effect === "Grayscale") {
      const gray = red * 0.299 + green * 0.587 + blue * 0.114;
      pixels.data[index] = gray;
      pixels.data[index + 1] = gray;
      pixels.data[index + 2] = gray;
    }
    if (effect === "Sepia") {
      pixels.data[index] = Math.min(255, red * 0.393 + green * 0.769 + blue * 0.189);
      pixels.data[index + 1] = Math.min(255, red * 0.349 + green * 0.686 + blue * 0.168);
      pixels.data[index + 2] = Math.min(255, red * 0.272 + green * 0.534 + blue * 0.131);
    }
    if (effect === "Invert") {
      pixels.data[index] = 255 - red;
      pixels.data[index + 1] = 255 - green;
      pixels.data[index + 2] = 255 - blue;
    }
  }
  context.putImageData(pixels, 0, 0);
};

const renderImageToCanvas = async (
  file: File,
  options: {
    background?: "transparent" | "white";
    resizeMode?: ResizeMode;
    width?: number;
    height?: number;
    rotate?: number;
    effect?: ImageEffect;
    flipHorizontal?: boolean;
  } = {},
) => {
  const image = await loadImage(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const target = getTargetSize(sourceWidth, sourceHeight, options.resizeMode ?? "Keep size", options.width ?? sourceWidth, options.height ?? sourceHeight);
  const rotate = options.rotate ?? 0;
  const swapsAxis = rotate === 90 || rotate === 270;
  const canvas = document.createElement("canvas");
  canvas.width = swapsAxis ? target.height : target.width;
  canvas.height = swapsAxis ? target.width : target.height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");
  if (options.background === "white") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate((rotate * Math.PI) / 180);
  context.scale(options.flipHorizontal ? -1 : 1, 1);
  context.drawImage(image, -target.width / 2, -target.height / 2, target.width, target.height);
  applyEffect(canvas, options.effect ?? "None");
  return canvas;
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Unable to read file as data URL."));
    reader.readAsDataURL(blob);
  });

const fileSummary = (file: File) => ({
  name: file.name,
  type: file.type || "application/octet-stream",
  size: file.size,
  extension: extensionOf(file.name),
  lastModified: new Date(file.lastModified).toISOString(),
});

const zipFiles = async (
  files: Array<{ name: string; blob: Blob }>,
  zipName: string,
  compressionLevel: number,
  extraFiles: Array<{ name: string; content: string }> = [],
) => {
  const zip = new JSZip();
  files.forEach((file) => zip.file(file.name, file.blob));
  extraFiles.forEach((file) => zip.file(file.name, file.content));
  const blob = await zip.generateAsync({
    type: "blob",
    compression: compressionLevel > 0 ? "DEFLATE" : "STORE",
    compressionOptions: { level: Math.min(Math.max(compressionLevel, 0), 9) },
    mimeType: "application/zip",
    comment: "Created by Gauss",
  });
  return createOutput(`${cleanName(zipName)}.zip`, blob, `ZIP created with ${files.length + extraFiles.length} item(s).`);
};

const copyPdfPages = async (target: PDFDocument, sourceFile: File, indices?: number[]) => {
  const source = await PDFDocument.load(await sourceFile.arrayBuffer());
  const sourceIndices = indices ?? source.getPageIndices();
  const pages = await target.copyPages(source, sourceIndices.filter((index) => index >= 0 && index < source.getPageCount()));
  pages.forEach((page) => target.addPage(page));
  return pages.length;
};

const parsePageRange = (range: string, pageCount: number) => {
  const indices = new Set<number>();
  const parts = range.split(",").map((part) => part.trim()).filter(Boolean);
  for (const part of parts.length ? parts : ["1-9999"]) {
    const [startValue, endValue] = part.split("-").map((value) => Number(value.trim()));
    const start = Number.isFinite(startValue) && startValue > 0 ? startValue : 1;
    const end = Number.isFinite(endValue) && endValue > 0 ? endValue : start;
    for (let page = start; page <= Math.min(end, pageCount); page += 1) indices.add(page - 1);
  }
  return Array.from(indices).sort((left, right) => left - right);
};

const writeWrappedText = (page: PDFPage, text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>) => {
  const { width, height } = page.getSize();
  const fontSize = 11;
  const lineHeight = 15;
  const maxChars = Math.max(Math.floor((width - 96) / 6), 40);
  const words = text.replace(/\s+/g, " ").split(" ");
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (nextLine.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }
  if (line) lines.push(line);

  let y = height - 54;
  for (const outputLine of lines.slice(0, 45)) {
    page.drawText(outputLine, { x: 48, y, size: fontSize, font, color: rgb(0.08, 0.09, 0.1) });
    y -= lineHeight;
  }
};

const createPdfFromFiles = async (files: File[], outputName: string) => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  let pageCount = 0;

  for (const file of files) {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      pageCount += await copyPdfPages(pdf, file);
      continue;
    }
    if (file.type.startsWith("image/")) {
      const canvas = await renderImageToCanvas(file, { background: "white" });
      const pngBlob = await canvasToBlob(canvas, "image/png");
      if (!pngBlob) continue;
      const image = await pdf.embedPng(await pngBlob.arrayBuffer());
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      pageCount += 1;
      continue;
    }
    const page = pdf.addPage();
    writeWrappedText(page, file.type.startsWith("text/") ? await file.text() : `${file.name}\n${file.type || "Unknown type"}\n${file.size} bytes`, font);
    pageCount += 1;
  }

  if (pageCount === 0) writeWrappedText(pdf.addPage(), "No supported content was available for PDF conversion.", font);
  const bytes = await pdf.save({ useObjectStreams: true });
  return createOutput(`${cleanName(outputName)}.pdf`, pdfBytesToBlob(bytes), `PDF created with ${Math.max(pageCount, 1)} page(s).`);
};

const convertImage = async (file: File, settings: ToolSettings) => {
  const format = getString(settings, "format", "WebP") as ImageFormat;
  const resizeMode = getString(settings, "resizeMode", "Keep size") as ResizeMode;
  const rotate = Number(getString(settings, "rotate", "0"));
  const effect = getString(settings, "effect", "None") as ImageEffect;
  const flipHorizontal = getBoolean(settings, "flipHorizontal", false);
  const hasTransform = resizeMode !== "Keep size" || rotate !== 0 || effect !== "None" || flipHorizontal;

  if (format === "Original" && !hasTransform) return { blob: file, name: file.name, message: "Copied original file without re-encoding." };

  const outputFormat = format === "Original" ? "PNG" : format;
  const canvas = await renderImageToCanvas(file, {
    background: outputFormat === "JPEG" ? "white" : "transparent",
    resizeMode,
    width: getNumber(settings, "width", 1920),
    height: getNumber(settings, "height", 1080),
    rotate,
    effect,
    flipHorizontal,
  });
  const encoded = await encodeCanvas(canvas, outputFormat, getNumber(settings, "quality", 85));
  return { blob: encoded.blob, name: `${baseNameOf(file.name)}.${encoded.extension}`, message: `Exported as ${encoded.label}${hasTransform ? " with transforms applied" : ""}.` };
};

const processImages = async (files: File[], settings: ToolSettings) => {
  const outputs: ToolOutput[] = [];
  for (const file of files) {
    const result = await convertImage(file, settings);
    outputs.push(await createOutput(result.name, result.blob, result.message));
  }
  return { summary: `${outputs.length} image output${outputs.length === 1 ? "" : "s"} ready.`, outputs };
};

const processPdf = async (files: File[], settings: ToolSettings) => {
  const action = getString(settings, "action", "Merge");
  const useObjectStreams = getBoolean(settings, "linearize", true);
  const editorPagesJson = getString(settings, "editorPagesJson", "");

  // Visual editor compilation path
  if (editorPagesJson) {
    try {
      const editorPages = JSON.parse(editorPagesJson) as Array<{ fileIndex: number; pageIndex: number; rotation: number }>;
      if (editorPages && editorPages.length > 0) {
        const loadedDocs = await Promise.all(
          files.map(async (file) => PDFDocument.load(await file.arrayBuffer()))
        );

        const pdf = await PDFDocument.create();
        for (const item of editorPages) {
          if (item.fileIndex >= 0 && item.fileIndex < loadedDocs.length) {
            const sourceDoc = loadedDocs[item.fileIndex];
            const pageCount = sourceDoc.getPageCount();
            if (item.pageIndex >= 0 && item.pageIndex < pageCount) {
              const [copiedPage] = await pdf.copyPages(sourceDoc, [item.pageIndex]);
              if (item.rotation) {
                copiedPage.setRotation(degrees(item.rotation));
              }
              pdf.addPage(copiedPage);
            }
          }
        }

        const bytes = await pdf.save({ useObjectStreams });
        return {
          summary: "PDF editor compilation completed.",
          outputs: [await createOutput("gauss-edited.pdf", pdfBytesToBlob(bytes), `Compiled ${editorPages.length} edited page(s).`)],
        };
      }
    } catch (error) {
      console.error("Failed visual PDF compilation, falling back", error);
    }
  }

  if (action === "Inspect") {
    const lines = ["Gauss PDF inspection", `Generated: ${new Date().toISOString()}`, ""];
    for (const file of files) {
      const pdf = await PDFDocument.load(await file.arrayBuffer());
      lines.push(`${file.name}: ${pdf.getPageCount()} page(s), ${file.size} bytes`);
    }
    return { summary: "PDF inspection completed.", outputs: [await createOutput("pdf-inspection.txt", new Blob([lines.join("\n")], { type: "text/plain" }), "PDF inspection text created.")] };
  }
  if (action === "Split") {
    const outputs: ToolOutput[] = [];
    for (const file of files) {
      const source = await PDFDocument.load(await file.arrayBuffer());
      for (let index = 0; index < source.getPageCount(); index += 1) {
        const pdf = await PDFDocument.create();
        const [page] = await pdf.copyPages(source, [index]);
        pdf.addPage(page);
        outputs.push(await createOutput(`${baseNameOf(file.name)}-page-${String(index + 1).padStart(3, "0")}.pdf`, pdfBytesToBlob(await pdf.save({ useObjectStreams })), `Extracted page ${index + 1}.`));
      }
    }
    return { summary: `${outputs.length} split page PDF${outputs.length === 1 ? "" : "s"} ready.`, outputs };
  }
  if (action === "Extract pages") {
    const outputs: ToolOutput[] = [];
    for (const file of files) {
      const source = await PDFDocument.load(await file.arrayBuffer());
      const pdf = await PDFDocument.create();
      const pages = await pdf.copyPages(source, parsePageRange(getString(settings, "pageRange", "1-9999"), source.getPageCount()));
      pages.forEach((page) => pdf.addPage(page));
      outputs.push(await createOutput(`${baseNameOf(file.name)}-pages.pdf`, pdfBytesToBlob(await pdf.save({ useObjectStreams })), `Extracted ${pages.length} selected page(s).`));
    }
    return { summary: `${outputs.length} selected-page PDF output${outputs.length === 1 ? "" : "s"} ready.`, outputs };
  }
  if (action === "Compress") {
    const outputs: ToolOutput[] = [];
    for (const file of files) {
      const pdf = await PDFDocument.create();
      const pageCount = await copyPdfPages(pdf, file);
      outputs.push(await createOutput(`${baseNameOf(file.name)}-optimized.pdf`, pdfBytesToBlob(await pdf.save({ useObjectStreams })), `Re-saved ${pageCount} page(s).`));
    }
    return { summary: `${outputs.length} optimized PDF output${outputs.length === 1 ? "" : "s"} ready.`, outputs };
  }

  const pdf = await PDFDocument.create();
  let pageCount = 0;
  for (const file of files) pageCount += await copyPdfPages(pdf, file);
  return { summary: "PDF merge completed.", outputs: [await createOutput("merged.pdf", pdfBytesToBlob(await pdf.save({ useObjectStreams })), `Merged ${files.length} PDF(s) into ${pageCount} page(s).`)] };
};

const bundleOutputs = async (outputs: ToolOutput[], zipName: string, shouldBundle: boolean) =>
  shouldBundle && outputs.length > 1 ? [await zipFiles(outputs.map((item) => ({ name: item.name, blob: item.blob })), zipName, 6)] : outputs;

const processConverter = async (files: File[], settings: ToolSettings) => {
  const target = getString(settings, "target", "ZIP");
  const prefix = cleanName(getString(settings, "renamePrefix", "gauss"));
  const bundle = getBoolean(settings, "bundle", false);

  if (target === "ZIP") return { summary: "ZIP conversion completed.", outputs: [await zipFiles(files.map((file) => ({ name: file.name, blob: file })), prefix, 6)] };
  if (target === "PDF") return { summary: "PDF conversion completed.", outputs: [await createPdfFromFiles(files, prefix)] };
  if (target === "CSV") {
    const rows = ["name,type,size,lastModified", ...files.map((file) => [file.name, file.type || "application/octet-stream", file.size, new Date(file.lastModified).toISOString()].map(csvEscape).join(","))];
    return { summary: "CSV inventory ready.", outputs: [await createOutput(`${prefix}.csv`, new Blob([rows.join("\n")], { type: "text/csv" }), "CSV inventory created.")] };
  }

  const outputs: ToolOutput[] = [];
  for (const [index, file] of files.entries()) {
    const numbered = `${prefix}-${String(index + 1).padStart(2, "0")}-${baseNameOf(file.name)}`;
    if (target === "TXT") outputs.push(await createOutput(`${numbered}.txt`, new Blob([file.type.startsWith("text/") ? await file.text() : `${file.name}\n${file.type || "Unknown type"}\n${file.size} bytes`], { type: "text/plain" }), "Text output created."));
    else if (target === "JSON") outputs.push(await createOutput(`${numbered}.json`, new Blob([JSON.stringify(fileSummary(file), null, 2)], { type: "application/json" }), "JSON metadata output created."));
    else if (target === "Data URL") outputs.push(await createOutput(`${numbered}.txt`, new Blob([await blobToDataUrl(file)], { type: "text/plain" }), "Data URL output created."));
    else if (target === "PNG" || target === "JPEG" || target === "WebP") {
      if (file.type.startsWith("image/")) {
        const result = await convertImage(file, { ...settings, format: target, quality: 90, resizeMode: "Keep size", effect: "None", rotate: "0", flipHorizontal: false });
        outputs.push(await createOutput(`${numbered}.${extensionOf(result.name)}`, result.blob, `${target} image output created.`));
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 630;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas is not available in this browser.");
        context.fillStyle = "#07110f";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#a5f3fc";
        context.font = "700 54px sans-serif";
        context.fillText(baseNameOf(file.name), 72, 164, 1050);
        context.fillStyle = "rgba(255,255,255,.72)";
        context.font = "32px sans-serif";
        context.fillText(file.type || "Unknown type", 72, 238, 1050);
        const encoded = await encodeCanvas(canvas, target, 90);
        outputs.push(await createOutput(`${numbered}.${encoded.extension}`, encoded.blob, `${target} label image created.`));
      }
    } else outputs.push(await createOutput(`${prefix}-${String(index + 1).padStart(2, "0")}-${file.name}`, file, "Original file copied with a new export name."));
  }
  return { summary: `${outputs.length} ${target} output${outputs.length === 1 ? "" : "s"} ready.`, outputs: await bundleOutputs(outputs, prefix, bundle) };
};

const processArchive = async (files: File[], settings: ToolSettings) => {
  const folderMode = getString(settings, "folderMode", "By extension");
  const archiveFiles = files.map((file) => ({
    name: folderMode === "By extension" ? `${extensionOf(file.name) || "no-extension"}/${file.name}` : folderMode === "By MIME type" ? `${cleanName((file.type || "unknown").replace("/", "-"))}/${file.name}` : file.name,
    blob: file,
  }));
  const extras = getBoolean(settings, "includeManifest", true) ? [{ name: "gauss-manifest.json", content: JSON.stringify(files.map(fileSummary), null, 2) }] : [];
  const output = await zipFiles(archiveFiles, getString(settings, "archiveName", "gauss-pack"), getNumber(settings, "compression", 6), extras);
  return { summary: "Archive created.", outputs: [output] };
};

const processBatch = async (files: File[], settings: ToolSettings) => {
  const operation = getString(settings, "operation", "Rename");
  const pattern = getString(settings, "pattern", "{index}-{name}");
  const startAt = getNumber(settings, "startAt", 1);
  const batchFiles = files.map((file, index) => {
    const extension = extensionOf(file.name);
    const base = baseNameOf(file.name);
    const patterned = pattern.replaceAll("{index}", String(index + startAt).padStart(2, "0")).replaceAll("{name}", base).replaceAll("{ext}", extension).replaceAll("{date}", new Date().toISOString().slice(0, 10));
    const renamed =
      operation === "Lowercase" ? `${base.toLowerCase()}${extension ? `.${extension}` : ""}` :
      operation === "Uppercase" ? `${base.toUpperCase()}${extension ? `.${extension}` : ""}` :
      operation === "Number only" ? `${String(index + startAt).padStart(3, "0")}${extension ? `.${extension}` : ""}` :
      `${cleanName(patterned)}${extension ? `.${extension}` : ""}`;
    return { name: `${operation === "Sort" ? `${extension || "no-extension"}/` : operation === "Tag" ? "tagged/" : ""}${renamed}`, blob: file };
  });
  const extras = operation === "Tag" ? [{ name: "gauss-tags.json", content: JSON.stringify({ pattern, files: batchFiles.map((file) => file.name) }, null, 2) }] : [];
  return { summary: `${operation} batch created.`, outputs: [await zipFiles(batchFiles, `gauss-${operation.toLowerCase().replaceAll(" ", "-")}-batch`, 6, extras)] };
};

const preprocessForOcr = async (file: File) => {
  const canvas = await renderImageToCanvas(file, { background: "white" });
  const context = canvas.getContext("2d");
  if (!context) return file;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < pixels.data.length; index += 4) {
    const gray = pixels.data[index] * 0.299 + pixels.data[index + 1] * 0.587 + pixels.data[index + 2] * 0.114;
    const contrasted = gray > 150 ? 255 : 0;
    pixels.data[index] = contrasted;
    pixels.data[index + 1] = contrasted;
    pixels.data[index + 2] = contrasted;
  }
  context.putImageData(pixels, 0, 0);
  return (await canvasToBlob(canvas, "image/png")) ?? file;
};

const languageCode = (language: string) => (language === "Thai" ? "tha" : language === "Japanese" ? "jpn" : language === "Auto detect" ? "eng+tha+jpn" : "eng");

const processOcr = async (files: File[], settings: ToolSettings) => {
  const language = getString(settings, "language", "English");
  const outputFormat = getString(settings, "output", "TXT");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker(languageCode(language));
  const outputs: ToolOutput[] = [];
  try {
    for (const file of files) {
      const text = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt") ? await file.text() : (await worker.recognize(getBoolean(settings, "deskew", true) ? await preprocessForOcr(file) : file)).data.text.trim() || "No text detected.";
      const base = `${baseNameOf(file.name)}-ocr`;
      outputs.push(outputFormat === "JSON"
        ? await createOutput(`${base}.json`, new Blob([JSON.stringify({ file: fileSummary(file), language, text }, null, 2)], { type: "application/json" }), `OCR JSON completed using ${language}.`)
        : await createOutput(`${base}.txt`, new Blob([text], { type: "text/plain" }), `OCR text completed using ${language}.`));
    }
  } finally {
    await worker.terminate();
  }
  return outputFormat === "ZIP" ? { summary: "OCR ZIP bundle ready.", outputs: [await zipFiles(outputs.map((item) => ({ name: item.name, blob: item.blob })), "ocr-results", 6)] } : { summary: `${outputs.length} OCR output${outputs.length === 1 ? "" : "s"} ready.`, outputs };
};

const processMetadata = async (files: File[], settings: ToolSettings) => {
  const format = getString(settings, "format", "JSON");
  const records = await Promise.all(files.map(async (file) => ({ ...fileSummary(file), dataUrl: getBoolean(settings, "includeDataUrl", false) && file.size <= 512_000 ? await blobToDataUrl(file) : undefined })));
  if (format === "CSV") return { summary: "Metadata CSV ready.", outputs: [await createOutput("metadata.csv", new Blob([["name,type,size,extension,lastModified", ...records.map((record) => [record.name, record.type, record.size, record.extension, record.lastModified].map(csvEscape).join(","))].join("\n")], { type: "text/csv" }), "CSV metadata report created.")] };
  if (format === "TXT") return { summary: "Metadata text ready.", outputs: [await createOutput("metadata.txt", new Blob([records.map((record) => `${record.name}\n  Type: ${record.type}\n  Size: ${record.size}\n  Modified: ${record.lastModified}`).join("\n\n")], { type: "text/plain" }), "Text metadata report created.")] };
  if (format === "HTML") return { summary: "Metadata HTML ready.", outputs: [await createOutput("metadata.html", new Blob([`<!doctype html><meta charset="utf-8"><title>Gauss metadata</title><table><thead><tr><th>Name</th><th>Type</th><th>Size</th><th>Modified</th></tr></thead><tbody>${records.map((record) => `<tr><td>${record.name}</td><td>${record.type}</td><td>${record.size}</td><td>${record.lastModified}</td></tr>`).join("")}</tbody></table>`], { type: "text/html" }), "HTML metadata report created.")] };
  return { summary: "Metadata JSON ready.", outputs: [await createOutput("metadata.json", new Blob([JSON.stringify(records, null, 2)], { type: "application/json" }), "JSON metadata report created.")] };
};

const processChecksum = async (files: File[], settings: ToolSettings) => {
  const algorithm = getString(settings, "algorithm", "SHA-256");
  const records = await Promise.all(files.map(async (file) => ({ name: file.name, size: file.size, algorithm, hash: Array.from(new Uint8Array(await crypto.subtle.digest(algorithm, await file.arrayBuffer()))).map((byte) => byte.toString(16).padStart(2, "0")).join("") })));
  const format = getString(settings, "format", "TXT");
  if (format === "CSV") return { summary: `${algorithm} CSV checksums ready.`, outputs: [await createOutput("checksums.csv", new Blob([["algorithm,hash,name,size", ...records.map((record) => [record.algorithm, record.hash, record.name, record.size].map(csvEscape).join(","))].join("\n")], { type: "text/csv" }), "Checksum CSV created.")] };
  if (format === "JSON") return { summary: `${algorithm} JSON checksums ready.`, outputs: [await createOutput("checksums.json", new Blob([JSON.stringify(records, null, 2)], { type: "application/json" }), "Checksum JSON created.")] };
  return { summary: `${algorithm} text checksums ready.`, outputs: [await createOutput("checksums.txt", new Blob([records.map((record) => `${record.hash}  ${record.name}`).join("\n")], { type: "text/plain" }), "Checksum text file created.")] };
};

const transformText = (content: string, action: string) => {
  if (action === "Uppercase") return content.toUpperCase();
  if (action === "Lowercase") return content.toLowerCase();
  if (action === "Line sort") return content.split(/\r?\n/).sort((left, right) => left.localeCompare(right)).join("\n");
  if (action === "Deduplicate lines") return Array.from(new Set(content.split(/\r?\n/))).join("\n");
  if (action === "Word count") return `Words: ${content.trim() ? content.trim().split(/\s+/).length : 0}\nLines: ${content.split(/\r?\n/).length}\nCharacters: ${content.length}`;
  return content.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
};

const processText = async (files: File[], settings: ToolSettings) => {
  const action = getString(settings, "action", "Clean whitespace");
  const outputFormat = getString(settings, "output", "TXT");
  const outputs: ToolOutput[] = [];
  for (const file of files) {
    const transformed = transformText(await file.text(), action);
    const base = `${baseNameOf(file.name)}-${cleanName(action).toLowerCase()}`;
    if (outputFormat === "JSON") outputs.push(await createOutput(`${base}.json`, new Blob([JSON.stringify({ file: fileSummary(file), action, text: transformed }, null, 2)], { type: "application/json" }), "Text JSON created."));
    else if (outputFormat === "CSV") outputs.push(await createOutput(`${base}.csv`, new Blob([`"text"\n${csvEscape(transformed)}`], { type: "text/csv" }), "Text CSV created."));
    else if (outputFormat === "HTML") outputs.push(await createOutput(`${base}.html`, new Blob([`<!doctype html><meta charset="utf-8"><pre>${transformed.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</pre>`], { type: "text/html" }), "Text HTML created."));
    else outputs.push(await createOutput(`${base}.txt`, new Blob([transformed], { type: "text/plain" }), "Text file created."));
  }
  return { summary: `${outputs.length} text output${outputs.length === 1 ? "" : "s"} ready.`, outputs };
};

export const processTool = (tool: Tool, files: File[], settings: ToolSettings): Promise<ToolProcessResult> => {
  if (tool.id === "image") return processImages(files, settings);
  if (tool.id === "pdf") return processPdf(files, settings);
  if (tool.id === "converter") return processConverter(files, settings);
  if (tool.id === "archive") return processArchive(files, settings);
  if (tool.id === "batch") return processBatch(files, settings);
  if (tool.id === "ocr") return processOcr(files, settings);
  if (tool.id === "metadata") return processMetadata(files, settings);
  if (tool.id === "checksum") return processChecksum(files, settings);
  if (tool.id === "text") return processText(files, settings);
  throw new Error(`Unknown tool: ${tool.id}`);
};
