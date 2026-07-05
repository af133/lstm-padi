import React, { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { KecamatanList } from "../dataKecamatan/KecamatanList";
import { KANDIDAT_FEATURES, FEATURE_LABELS, FeatureName, KecamatanRow, makeInitialFeatures } from "../lstm/lstm";
import { saveKecamatanFeatures } from "../firebase/firebase";

type AdminDashboardProps = {
  rows: KecamatanRow[];
  setRows: React.Dispatch<React.SetStateAction<KecamatanRow[]>>;
  syncing: boolean;
  lastSync: Date | null;
  weatherLog: any[];
  dbError: string | null;
  syncBmkgToFirestore: () => Promise<void>;
  runPrediction: (targetKode?: string) => Promise<void>;
  onBack: () => void;
  onLogout: () => void;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  rows, setRows, syncing, lastSync, weatherLog, dbError,
  syncBmkgToFirestore, runPrediction, onBack, onLogout
}) => {
  const [selectedKode, setSelectedKode] = useState(KecamatanList[0]?.kode || "");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Excel import state
  const [excelPreview, setExcelPreview] = useState<Record<string, number>[] | null>(null);
  const [excelFileName, setExcelFileName] = useState("");
  const [importingExcel, setImportingExcel] = useState(false);

  const selectedRow = rows.find((r) => r.kode === selectedKode);

  // ─── Save single kecamatan features ───
  const handleSave = async () => {
    if (!selectedRow) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      await saveKecamatanFeatures(selectedRow.kode, selectedRow.features);
      setStatusMsg({ type: "success", text: `Fitur ${selectedRow.nama} berhasil disimpan!` });
      runPrediction(selectedRow.kode);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Gagal: ${err.message || "Error"}` });
    } finally {
      setSaving(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  // ─── Handle feature change ───
  const handleFeatureChange = (fn: FeatureName, value: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.kode === selectedKode ? { ...r, features: { ...r.features, [fn]: value } } : r
      )
    );
  };

  // ─── Excel file handler ───
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        // Map Excel rows to our feature format
        const parsed: Record<string, number>[] = [];
        for (const row of jsonData) {
          const kode = String(row.kode || row.Kode || row.KODE || "").trim();
          const kecName = String(row.kecamatan || row.Kecamatan || row.KECAMATAN || "").trim();

          // Find matching kecamatan
          const match = KecamatanList.find(
            (k) => k.kode === kode || k.nama.toUpperCase() === kecName.toUpperCase()
          );
          if (!match) continue;

          const features: Record<string, number> = { _kode: 0, _nama: 0 };
          (features as any)._kode = match.kode;
          (features as any)._nama = match.nama;

          for (const fn of KANDIDAT_FEATURES) {
            // Try exact match, then common aliases
            const val = row[fn] ?? row[fn.replace(/ /g, "_")] ?? row[fn.replace(/_/g, " ")];
            features[fn] = val !== undefined && val !== "" ? Number(val) : 0;
          }
          parsed.push(features);
        }
        setExcelPreview(parsed);
      } catch (err) {
        console.error("Excel parse error:", err);
        setStatusMsg({ type: "error", text: "Gagal membaca file Excel. Pastikan format benar." });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // ─── Import Excel data to Firestore ───
  const handleImportExcel = async () => {
    if (!excelPreview?.length) return;
    setImportingExcel(true);
    setStatusMsg(null);
    let successCount = 0;

    try {
      for (const row of excelPreview) {
        const kode = (row as any)._kode;
        if (!kode) continue;

        const features: Record<string, number> = {};
        for (const fn of KANDIDAT_FEATURES) {
          features[fn] = row[fn] ?? 0;
        }

        await saveKecamatanFeatures(kode, features);

        // Update local state
        setRows((prev) =>
          prev.map((r) =>
            r.kode === kode ? { ...r, features: features as Record<FeatureName, number> } : r
          )
        );
        successCount++;
      }

      setStatusMsg({ type: "success", text: `${successCount} kecamatan berhasil diimport ke Firebase!` });
      setExcelPreview(null);
      setExcelFileName("");
      runPrediction();
    } catch (err: any) {
      setStatusMsg({ type: "error", text: `Import gagal: ${err.message}` });
    } finally {
      setImportingExcel(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f4] text-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#f6f8f4]/85 border-b border-emerald-900/10">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white flex items-center justify-center font-black shadow shadow-sky-700/25">
              AD
            </div>
            <div>
              <div className="font-[700] text-[17px] tracking-tight text-sky-950">Dashboard Admin • SiPanen</div>
              <div className="text-[11.5px] text-sky-800/70 -mt-0.5">Manajemen data fitur, sinkronisasi cuaca, dan import dataset</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <button onClick={onBack} className="px-3.5 py-2 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition-all">
              ← Kembali ke Dashboard
            </button>
            <button onClick={onLogout} className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-700 font-semibold transition-all">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* DB Error Banner */}
      {dbError && (
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 mt-4">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-[12.5px] font-medium flex items-start gap-2.5 shadow-sm">
            <span className="text-[15px] pt-0.5">⚠️</span>
            <div>
              <span className="font-semibold">Kesalahan Koneksi Firestore:</span> {dbError}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-7 space-y-6">
        {/* ─── BMKG Sync Card ─── */}
        <section className="rounded-[22px] border border-sky-900/10 bg-gradient-to-br from-white to-sky-50/60 p-5 shadow-sm">
          <div className="font-[700] text-sky-950 text-[16px]">🛰️ Sinkronisasi Cuaca BMKG → Firestore</div>
          <div className="text-[12px] text-sky-900/80 mt-1 leading-relaxed">
            Endpoint: <code className="bg-sky-100/70 px-1 rounded">api.bmkg.go.id/publik/prakiraan-cuaca?adm4={"{"} kode_desa {"}"}</code><br />
            Data cuaca otomatis tersinkronisasi setiap 3 jam. Gunakan tombol di bawah untuk sync manual.
          </div>
          <div className="flex flex-wrap gap-3 mt-4 items-center">
            <button disabled={syncing} onClick={syncBmkgToFirestore}
              className="px-5 py-[10px] rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-[13px] font-[650] disabled:opacity-60 transition-all shadow-sm">
              {syncing ? "⏳ Syncing…" : "🔄 Sync BMKG Sekarang"}
            </button>
            <div className="text-[12px] text-sky-900/80">
              {lastSync ? "Terakhir: " + lastSync.toLocaleString("id-ID") : "Belum pernah sync"}
            </div>
          </div>
          {weatherLog.length > 0 && (
            <div className="mt-4 text-[11.5px] max-h-[180px] overflow-auto border-t border-sky-100 pt-3 space-y-[6px]">
              {weatherLog.slice(0, 10).map((w, i) => (
                <div key={i} className="flex justify-between text-sky-950">
                  <span className="font-[600]">{w.kecamatan_nama || w.kecamatan_kode}</span>
                  <span>{w.temp_avg ?? "-"}°C • {w.humidity_avg ?? "-"}% • {w.windspeed_avg ?? "-"} km/h</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Import Excel ─── */}
        <section className="rounded-[22px] border border-violet-900/10 bg-gradient-to-br from-white to-violet-50/40 p-5 shadow-sm">
          <div className="font-[700] text-violet-950 text-[16px]">📊 Import Data dari Excel</div>
          <div className="text-[12px] text-violet-900/80 mt-1">
            Upload file <code>.xlsx</code> / <code>.xls</code> dengan kolom: <code>kode</code> (atau <code>kecamatan</code>), dan kolom fitur sesuai nama fitur model.
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="px-4 py-[10px] rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-[13px] font-[600] cursor-pointer transition-all shadow-sm">
              📁 Pilih File Excel
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleExcelUpload} className="hidden" />
            </label>
            {excelFileName && (
              <span className="text-[12px] text-violet-800 font-medium">{excelFileName}</span>
            )}
          </div>

          {/* Preview */}
          {excelPreview && excelPreview.length > 0 && (
            <div className="mt-4">
              <div className="text-[13px] font-[600] text-violet-950 mb-2">
                Preview: {excelPreview.length} kecamatan ditemukan
              </div>
              <div className="overflow-x-auto max-h-[280px] rounded-xl border border-violet-200">
                <table className="min-w-full text-[11px]">
                  <thead className="bg-violet-50 text-violet-700 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2">Kecamatan</th>
                      {KANDIDAT_FEATURES.slice(0, 8).map((fn) => (
                        <th key={fn} className="text-right px-2 py-2">{fn}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelPreview.map((row, i) => (
                      <tr key={i} className="border-t border-violet-100">
                        <td className="px-3 py-1.5 font-[600]">{(row as any)._nama}</td>
                        {KANDIDAT_FEATURES.slice(0, 8).map((fn) => (
                          <td key={fn} className="text-right px-2 py-1.5">{row[fn] ?? "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  disabled={importingExcel}
                  onClick={handleImportExcel}
                  className="px-4 py-[10px] rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-[13px] font-[650] disabled:opacity-60 shadow-sm transition-all"
                >
                  {importingExcel ? "⏳ Importing…" : "✅ Import & Simpan ke Firebase"}
                </button>
                <button
                  onClick={() => { setExcelPreview(null); setExcelFileName(""); }}
                  className="px-4 py-[10px] rounded-xl border border-slate-300 text-[13px] font-[600] hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ─── Manual Feature Editor ─── */}
        <section className="rounded-[22px] border border-emerald-900/10 bg-white p-5 shadow-sm">
          <div className="font-[700] text-emerald-950 text-[16px] mb-1">✏️ Edit Fitur Manual — Per Kecamatan</div>
          <div className="text-[12px] text-slate-500 mb-4">
            Pilih kecamatan, ubah nilai fitur, lalu simpan ke Firebase. Data akan langsung digunakan untuk prediksi.
          </div>

          {/* Status message */}
          {statusMsg && (
            <div className={`mb-4 px-4 py-3 rounded-xl text-[12.5px] font-medium ${
              statusMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                : "bg-rose-50 text-rose-800 border border-rose-100"
            }`}>
              {statusMsg.text}
            </div>
          )}

          {/* Kecamatan selector */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={selectedKode}
              onChange={(e) => setSelectedKode(e.target.value)}
              className="text-[13px] border border-slate-300 rounded-xl px-3 py-[9px] bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/25"
            >
              {KecamatanList.map((k) => (
                <option key={k.kode} value={k.kode}>{k.nama} ({k.kode})</option>
              ))}
            </select>
            <button disabled={saving} onClick={handleSave}
              className="px-4 py-[9px] rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-[650] disabled:opacity-60 shadow-sm transition-all">
              {saving ? "Menyimpan…" : "💾 Simpan ke Firebase"}
            </button>
            <button onClick={() => {
              if (!selectedRow) return;
              const idx = KecamatanList.findIndex((k) => k.kode === selectedKode);
              const fresh = makeInitialFeatures(selectedRow.nama, idx);
              setRows((prev) => prev.map((r) => r.kode === selectedKode ? { ...r, features: fresh } : r));
            }}
              className="px-4 py-[9px] rounded-xl border border-slate-300 text-[13px] font-[600] hover:bg-slate-50 transition-all">
              🔄 Reset Default
            </button>
          </div>

          {/* Feature inputs grid */}
          {selectedRow && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
              {KANDIDAT_FEATURES.map((fn) => (
                <label key={fn} className="block">
                  <div className="text-[10.5px] text-slate-600 mb-1 truncate" title={FEATURE_LABELS[fn]}>{FEATURE_LABELS[fn]}</div>
                  <input
                    type="number"
                    step="any"
                    value={selectedRow.features[fn]}
                    onChange={(e) => handleFeatureChange(fn, isNaN(parseFloat(e.target.value)) ? 0 : parseFloat(e.target.value))}
                    className="w-full text-[12.5px] border border-slate-300 rounded-lg px-[10px] py-[7px] focus:outline-none focus:ring-2 focus:ring-emerald-500/25 bg-white transition-all"
                  />
                </label>
              ))}
            </div>
          )}
        </section>

        {/* ─── Overview Table ─── */}
        <section className="rounded-[22px] border border-emerald-900/10 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 font-[700] text-emerald-950 text-[15px]">
            📋 Data Fitur 31 Kecamatan
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11.5px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-[10px]">Kecamatan</th>
                  <th className="text-right px-3 py-[10px]">Luas Tanam</th>
                  <th className="text-right px-3 py-[10px]">Panen Bersih</th>
                  <th className="text-right px-3 py-[10px]">Suhu °C</th>
                  <th className="text-right px-3 py-[10px]">Kelembaban</th>
                  <th className="text-right px-3 py-[10px]">Curah Hujan</th>
                  <th className="text-right px-3 py-[10px]">Pupuk (kg)</th>
                  <th className="text-right px-3 py-[10px]">Prediksi (ton)</th>
                  <th className="text-right px-4 py-[10px]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.kode}
                    className={`border-t border-slate-100 hover:bg-emerald-50/40 ${r.kode === selectedKode ? "bg-emerald-50/80" : ""}`}
                  >
                    <td className="px-4 py-[9px]">
                      <div className="font-[620] text-emerald-950">{r.nama}</div>
                      <div className="text-[10px] text-slate-500">{r.kode}</div>
                    </td>
                    <td className="text-right px-3">{r.features["luas tanam"]}</td>
                    <td className="text-right px-3">{r.features["luas panen bersih"]}</td>
                    <td className="text-right px-3">{r.features.suhu_rata2_c?.toFixed?.(1) ?? "-"}</td>
                    <td className="text-right px-3">{r.features.kelembaban_persen ?? "-"}</td>
                    <td className="text-right px-3">{r.features.curah_hujan_mm ?? "-"}</td>
                    <td className="text-right px-3">{r.features.jumlah_pupuk?.toLocaleString?.("id-ID") ?? "-"}</td>
                    <td className="text-right px-3 font-[700] text-emerald-800">{r.prediksi.toLocaleString("id-ID")}</td>
                    <td className="text-right px-4">
                      <button onClick={() => setSelectedKode(r.kode)} className="text-emerald-700 text-[11px] hover:underline font-[600]">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};
