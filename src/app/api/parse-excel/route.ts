import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_EXTS = [".xlsx", ".xls", ".csv"];
const NAME_HEADERS = ["nama", "name", "label", "teks", "text"];

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File wajib dipilih" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const hasAllowedExt = ALLOWED_EXTS.some((ext) => fileName.endsWith(ext));
    if (!hasAllowedExt) {
      return NextResponse.json(
        { error: "Format file harus .xlsx, .xls, atau .csv" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let names: string[] = [];

    if (fileName.endsWith(".csv")) {
      // Parse CSV: try comma or semicolon delimiter
      const text = buffer.toString("utf-8");
      const lines = text.split(/\r?\n/);
      names = lines
        .map((line) => {
          // Take first column
          const col = line.split(/[;,]/)[0]?.trim() ?? "";
          return col;
        })
        .filter((n) => n.length > 0 && !NAME_HEADERS.includes(n.toLowerCase()));
    } else {
      // Parse Excel (.xlsx / .xls)
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
      }) as string[][];

      if (rows.length === 0) {
        return NextResponse.json({ error: "Sheet kosong" }, { status: 400 });
      }

      // Detect name column by header keywords
      const firstRow = rows[0].map((h) => String(h).toLowerCase().trim());
      let nameColIdx = 0;
      const detected = firstRow.findIndex((h) => NAME_HEADERS.includes(h));
      let startRow = 0;

      if (detected !== -1) {
        // Has named header row
        nameColIdx = detected;
        startRow = 1;
      }

      names = rows
        .slice(startRow)
        .map((row) => String(row[nameColIdx] ?? "").trim())
        .filter((n) => n.length > 0);
    }

    if (names.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada nama yang ditemukan. Pastikan kolom pertama berisi nama." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      names,
      count: names.length,
    });
  } catch (err) {
    console.error("[PARSE_EXCEL]", err);
    return NextResponse.json(
      { error: "Gagal membaca file. Pastikan format file valid." },
      { status: 500 }
    );
  }
}
