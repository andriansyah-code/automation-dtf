import "server-only";

import {
  createCanvas,
  loadImage,
  GlobalFonts,
  Canvas,
  Image,
} from "@napi-rs/canvas";
import path from "path";
import fs from "fs";

import {
  CM_TO_PX,
  PAGE_WIDTH_PX,
  PAGE_HEIGHT_PX,
  MAX_FONT_RATIO,
  MIN_FONT_SIZE_PX,
  MAX_TEXT_WIDTH_RATIO,
  OUTPUT_FORMAT,
  OUTPUT_DIR,
  PAGE_BG_COLOR,
  FALLBACK_DARK_BG,
  FALLBACK_LIGHT_BG,
} from "./print-spec";

// ─── Constants ──────────────────────────────────────────────────────────────

const FONTS_DIR      = path.join(process.cwd(), "public", "fonts");
const BACKGROUNDS_DIR = path.join(process.cwd(), "public", "backgrounds");
// ─── Types ───────────────────────────────────────────────────────────────────

export interface LabelDetail {
  name: string;
  fontFamily?: string | null;
  fontFilePath?: string | null;
  backgroundImagePath?: string | null;
  fontColor?: string | null;
  quantity: number;
}

export interface GenerateOptions {
  transactionId: string;
  printWidthCm: number;
  labelHeightCm: number;
  details: LabelDetail[];
}

export interface GenerateResult {
  outputPath: string;  // public URL e.g. /output/txid/output.png
  totalLabels: number;
  totalPages: number;
}

// ─── Font Registry ───────────────────────────────────────────────────────────

const registeredFonts = new Map<string, string>(); // fontFamily → registered alias

function ensureFontRegistered(fontFamily: string, filePath: string): string {
  if (registeredFonts.has(fontFamily)) {
    return registeredFonts.get(fontFamily)!;
  }

  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.join(FONTS_DIR, filePath);

  if (fs.existsSync(absPath)) {
    GlobalFonts.registerFromPath(absPath, fontFamily);
    registeredFonts.set(fontFamily, fontFamily);
  }
  return fontFamily;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cmToPx(cm: number): number {
  return Math.round(cm * CM_TO_PX);
}

async function loadBackgroundImage(imgPath: string): Promise<Image | null> {
  try {
    const absPath = path.isAbsolute(imgPath)
      ? imgPath
      : path.join(BACKGROUNDS_DIR, imgPath);
    if (!fs.existsSync(absPath)) return null;
    return await loadImage(absPath);
  } catch {
    return null;
  }
}

/** Draw one label at position (x, y) on the canvas context */
async function drawLabel(
  ctx: ReturnType<Canvas["getContext"]>,
  x: number,
  y: number,
  labelW: number,
  labelH: number,
  name: string,
  fontFamily: string,
  fontColor: string,
  bgImage: Image | null,
  bgFallbackColor: string
): Promise<void> {
  ctx.save();
  ctx.translate(x, y);

  // 1. Draw background (image or solid color fallback)
  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, labelW, labelH);
  } else {
    ctx.fillStyle = bgFallbackColor;
    ctx.fillRect(0, 0, labelW, labelH);
  }

  // 2. Fit font size (max 60% of label height, min 8px)
  const maxFontPx = Math.floor(labelH * MAX_FONT_RATIO);
  const minFontPx = MIN_FONT_SIZE_PX;
  let fontSize = Math.max(minFontPx, maxFontPx);
  const maxTextWidth = labelW * MAX_TEXT_WIDTH_RATIO;

  ctx.textBaseline = "middle";
  ctx.fillStyle = fontColor;

  while (fontSize > minFontPx) {
    ctx.font = `bold ${fontSize}px "${fontFamily}", "Arial"`;
    const m = ctx.measureText(name);
    if (m.width <= maxTextWidth) break;
    fontSize -= 1;
  }

  ctx.font = `bold ${fontSize}px "${fontFamily}", "Arial"`;
  const measured = ctx.measureText(name);
  const textX = (labelW - measured.width) / 2;
  const textY = labelH / 2;
  ctx.fillText(name, textX, textY);

  ctx.restore();
}

// ─── Main Generator ───────────────────────────────────────────────────────────

export async function generateLabels(opts: GenerateOptions): Promise<GenerateResult> {
  const { transactionId, printWidthCm, labelHeightCm, details } = opts;

  const labelW = cmToPx(printWidthCm);
  const labelH = cmToPx(labelHeightCm);

  // Grid layout
  const cols = Math.max(1, Math.floor(PAGE_WIDTH_PX / labelW));
  const rowsPerPage = Math.max(1, Math.floor(PAGE_HEIGHT_PX / labelH));

  // Ensure output directory
  const txOutDir = path.join(OUTPUT_DIR, transactionId);
  fs.mkdirSync(txOutDir, { recursive: true });

  // Register all custom fonts
  for (const d of details) {
    if (d.fontFamily && d.fontFilePath) {
      ensureFontRegistered(d.fontFamily, d.fontFilePath);
    }
  }

  // Pre-load background images (cached per path)
  const bgCache = new Map<string, Image | null>();
  for (const d of details) {
    if (d.backgroundImagePath && !bgCache.has(d.backgroundImagePath)) {
      bgCache.set(d.backgroundImagePath, await loadBackgroundImage(d.backgroundImagePath));
    }
  }

  // Build flat label queue: quantity × cols cells per detail
  interface LabelCell {
    name: string;
    fontFamily: string;
    fontColor: string;
    bgImage: Image | null;
    bgFallback: string;
  }

  const queue: LabelCell[] = [];
  for (const d of details) {
    const fontFamily = d.fontFamily || "Arial";
    const fontColor  = d.fontColor  || "#FFFFFF";
    const bgImage    = d.backgroundImagePath ? (bgCache.get(d.backgroundImagePath) ?? null) : null;
    // Determine a sensible fallback color for when no background image exists
    const bgFallback = fontColor === "#FFFFFF" || fontColor.toLowerCase() === "#ffffff"
      ? FALLBACK_DARK_BG
      : FALLBACK_LIGHT_BG;

    const count = d.quantity * cols;
    for (let i = 0; i < count; i++) {
      queue.push({ name: d.name, fontFamily, fontColor, bgImage, bgFallback });
    }
  }

  if (queue.length === 0) {
    throw new Error("Tidak ada label untuk di-generate");
  }

  const totalRows  = Math.ceil(queue.length / cols);
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  const outputFiles: string[] = [];

  // Render page by page
  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    const canvas = createCanvas(PAGE_WIDTH_PX, PAGE_HEIGHT_PX);
    const ctx = canvas.getContext("2d");

    // White page background
    ctx.fillStyle = PAGE_BG_COLOR;
    ctx.fillRect(0, 0, PAGE_WIDTH_PX, PAGE_HEIGHT_PX);

    const startCell = pageIdx * rowsPerPage * cols;
    const endCell   = Math.min(startCell + rowsPerPage * cols, queue.length);

    for (let ci = startCell; ci < endCell; ci++) {
      const local = ci - startCell;
      const row   = Math.floor(local / cols);
      const col   = local % cols;
      const cell  = queue[ci];

      await drawLabel(
        ctx,
        col * labelW,
        row * labelH,
        labelW,
        labelH,
        cell.name,
        cell.fontFamily,
        cell.fontColor,
        cell.bgImage,
        cell.bgFallback
      );
    }

    const pageFile = totalPages === 1
      ? "output.png"
      : `output_page${pageIdx + 1}.png`;

    const buffer = canvas.toBuffer(OUTPUT_FORMAT);
    fs.writeFileSync(path.join(txOutDir, pageFile), buffer);
    outputFiles.push(pageFile);
  }

  return {
    outputPath:  `/output/${transactionId}/${outputFiles[0]}`,
    totalLabels: queue.length,
    totalPages,
  };
}
