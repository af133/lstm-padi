import * as XLSX from "xlsx";
import { KecamatanRow, KANDIDAT_FEATURES, makeInitialFeatures } from "../lstm/lstm";
import { KecamatanList } from "../dataKecamatan/KecamatanList";
import { deleteAllKecamatanFeatures, saveKecamatanFeatures } from "../firebase/firebase";

// Generate sample data dengan timestamps
export function generateSampleData(): KecamatanRow[] {
  const now = Date.now();
  return KecamatanList.map((kec, idx) => ({
    ...kec,
    ...makeInitialFeatures(),
    prediksi: Math.random() * 3000 + 500,
    confidence: Math.random() * 0.4 + 0.6,
    trend: ["naik", "stabil", "turun"][Math.floor(Math.random() * 3)] as "naik" | "stabil" | "turun",
    timestamp: now - idx * 1000 * 60 * 60 * 24, // Stagger timestamps
    luasHa: 260 + Math.random() * 100
  }));
}

// Delete semua data dengan confirmation
export async function deleteAllData(confirmMessage: string): Promise<boolean> {
  if (confirmMessage !== "HAPUS SEMUA DATA") {
    return false;
  }
  try {
    await deleteAllKecamatanFeatures();
    return true;
  } catch (err) {
    console.error("Error deleting all data:", err);
    return false;
  }
}

// Add sample data ke Firebase
export async function addSampleDataToFirebase(rows: KecamatanRow[]): Promise<number> {
  let count = 0;
  for (const row of rows) {
    try {
      await saveKecamatanFeatures(row.kode, {
        ...row.features,
        timestamp: row.timestamp || Date.now()
      });
      count++;
    } catch (err) {
      console.error(`Error saving ${row.kode}:`, err);
    }
  }
  return count;
}

// Export data to CSV
export function exportToCSV(rows: KecamatanRow[], filename = "sipanen-data.csv") {
  const csv = [
    ["Kode", "Kecamatan", "Prediksi (ton)", "Confidence", "Trend", "Timestamp", "Tanggal Update", ...KANDIDAT_FEATURES],
    ...rows.map(row => [
      row.kode,
      row.nama,
      row.prediksi.toFixed(2),
      row.confidence.toFixed(2),
      row.trend,
      row.timestamp || "",
      row.timestamp ? new Date(row.timestamp).toLocaleString("id-ID") : "",
      ...KANDIDAT_FEATURES.map(fn => (row.features[fn as any] || 0).toString())
    ])
  ]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Export data to Excel
export function exportToExcel(rows: KecamatanRow[], filename = "sipanen-data.xlsx") {
  const data = rows.map(row => ({
    Kode: row.kode,
    Kecamatan: row.nama,
    "Prediksi (ton)": row.prediksi.toFixed(2),
    "Confidence": row.confidence.toFixed(2),
    "Trend": row.trend,
    "Timestamp": row.timestamp || "",
    "Tanggal Update": row.timestamp ? new Date(row.timestamp).toLocaleString("id-ID") : "",
    ...Object.fromEntries(
      KANDIDAT_FEATURES.map(fn => [fn, row.features[fn as any] || 0])
    )
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, filename);
}

// Generate import template Excel
export function downloadImportTemplate() {
  const template = [
    {
      Kode: "3515060",
      Kecamatan: "Sumbersari",
      ...Object.fromEntries(
        KANDIDAT_FEATURES.map(fn => [fn, 0])
      )
    },
    {
      Kode: "3515070",
      Kecamatan: "Kaliwates",
      ...Object.fromEntries(
        KANDIDAT_FEATURES.map(fn => [fn, 0])
      )
    }
  ];

  const ws = XLSX.utils.json_to_sheet(template);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, "sipanen-import-template.xlsx");
}

// Parse Excel with timestamps
export function parseExcelWithTimestamp(jsonData: any[]): Record<string, any>[] {
  const parsed: Record<string, any>[] = [];
  const now = Date.now();

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    const kode = String(row.kode || row.Kode || row.KODE || "").trim();
    const kecName = String(row.kecamatan || row.Kecamatan || row.KECAMATAN || "").trim();

    const match = KecamatanList.find(
      (k) => k.kode === kode || k.nama.toUpperCase() === kecName.toUpperCase()
    );
    if (!match) continue;

    const features: Record<string, number> = {};
    for (const fn of KANDIDAT_FEATURES) {
      const val = row[fn] ?? row[fn.replace(/ /g, "_")] ?? row[fn.replace(/_/g, " ")];
      features[fn] = val !== undefined && val !== "" ? Number(val) : 0;
    }

    parsed.push({
      ...features,
      _kode: match.kode,
      _nama: match.nama,
      _timestamp: now - i * 1000 * 60 // Stagger timestamps
    });
  }

  return parsed;
}

// Filter rows by date range
export function filterByDateRange(rows: KecamatanRow[], startDate: Date, endDate: Date): KecamatanRow[] {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return rows.filter(row => {
    const ts = row.timestamp || 0;
    return ts >= start && ts <= end;
  });
}

// Filter rows by kecamatan name
export function filterByKecamatan(rows: KecamatanRow[], kecamatanName: string): KecamatanRow[] {
  const search = kecamatanName.toLowerCase();
  return rows.filter(row => row.nama.toLowerCase().includes(search) || row.kode.includes(search));
}

// Get most recent data per kecamatan
export function getLatestDataPerKecamatan(rows: KecamatanRow[]): KecamatanRow[] {
  const map = new Map<string, KecamatanRow>();
  for (const row of rows) {
    const existing = map.get(row.kode);
    if (!existing || (row.timestamp || 0) > (existing.timestamp || 0)) {
      map.set(row.kode, row);
    }
  }
  return Array.from(map.values());
}
