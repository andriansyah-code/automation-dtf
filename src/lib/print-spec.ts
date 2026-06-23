/**
 * ⚠️ PRODUCTION-CRITICAL — JANGAN DIUBAH TANPA APPROVAL OWNER.
 *
 * Nilai di file ini menentukan hasil cetak fisik label DTF.
 * Setiap perubahan DPI, ukuran halaman, rasio font, dimensi label,
 * output format, fallback ukuran, atau layout produksi dapat mengubah hasil cetak.
 *
 * Lihat audit CRE-3 dan issue CRE-4 untuk daftar dimensi yang dikunci.
 */

// ⚠️ PRODUCTION-CRITICAL: resolusi cetak.
export const DPI = 300;

// ⚠️ PRODUCTION-CRITICAL: konversi cm ke pixel.
export const CM_TO_PX = DPI / 2.54; // 1 cm ≈ 118.11 px at 300 DPI

// ⚠️ PRODUCTION-CRITICAL: ukuran halaman cetak (A4) dalam cm.
export const PAGE_WIDTH_CM = 21.0;
export const PAGE_HEIGHT_CM = 29.7;

// ⚠️ PRODUCTION-CRITICAL: dimensi halaman dalam pixel (A4 @ 300 DPI).
export const PAGE_WIDTH_PX = Math.round(PAGE_WIDTH_CM * CM_TO_PX); // 2480 px
export const PAGE_HEIGHT_PX = Math.round(PAGE_HEIGHT_CM * CM_TO_PX); // 3508 px

// ⚠️ PRODUCTION-CRITICAL: rasio maksimum tinggi font terhadap tinggi label.
export const MAX_FONT_RATIO = 0.60;

// ⚠️ PRODUCTION-CRITICAL: ukuran font minimum dalam pixel.
export const MIN_FONT_SIZE_PX = 8;

// ⚠️ PRODUCTION-CRITICAL: rasio lebar maksimum teks terhadap lebar label.
export const MAX_TEXT_WIDTH_RATIO = 0.86;

// ⚠️ PRODUCTION-CRITICAL: format output gambar.
export const OUTPUT_FORMAT = "image/png";

// ⚠️ PRODUCTION-CRITICAL: direktori output relatif.
export const OUTPUT_DIR = "public/output";

// ⚠️ PRODUCTION-CRITICAL: warna latar halaman (putih).
export const PAGE_BG_COLOR = "#FFFFFF";

// ⚠️ PRODUCTION-CRITICAL: warna fallback background saat font berwarna terang.
export const FALLBACK_DARK_BG = "#1a1a2e";

// ⚠️ PRODUCTION-CRITICAL: warna fallback background saat font berwarna gelap.
export const FALLBACK_LIGHT_BG = "#f5f5f5";

// ⚠️ PRODUCTION-CRITICAL: lebar cetak default dalam cm.
export const DEFAULT_PRINT_WIDTH_CM = 5.0;

// ⚠️ PRODUCTION-CRITICAL: tinggi label default dalam cm.
export const DEFAULT_LABEL_HEIGHT_CM = 1.0;
