import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { KecamatanList, GEOJSONKodeKecamatan } from "./dataKecamatan/KecamatanList";
import {
  FeatureName,
  KecamatanRow,
  KANDIDAT_FEATURES,
  makeInitialFeatures,
  heuristicPredict
} from "./lstm/lstm";
import { useLstmModel } from "./lstm/useLstmModel";
import { useBmkgFirestore } from "./firebase/useBmkgFirestore";
import { fetchKecamatanFeatures } from "./firebase/firebase";
import { AuthModal } from "./components/AuthModal";
import { PredictionChart } from "./components/PredictionChart";
import { AdminDashboard } from "./components/AdminDashboard";

type KecamatanFeatureProps = {
  NAMOBJ: string;
  WADMKC: string;
  WADMKK: string;
  WADMPR: string;
  kode: string;
  kode_bmkg?: string;
  REMARK?: string;
};
type AdministrativeProps = Partial<KecamatanFeatureProps> & Record<string, any>;
type KecamatanFC = GeoJSON.FeatureCollection<any, AdministrativeProps>;
type HarvestStatus = "aman" | "waspada" | "kritis";

const STATUS_META: Record<HarvestStatus, { label: string; color: string; stroke: string; bg: string; text: string; desc: string }> = {
  aman: {
    label: "Aman",
    color: "#22c55e",
    stroke: "#15803d",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-800",
    desc: "Prediksi panen dan cuaca masih mendukung."
  },
  waspada: {
    label: "Waspada",
    color: "#f59e0b",
    stroke: "#b45309",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    desc: "Ada penurunan produktivitas atau indikasi cuaca yang perlu dipantau."
  },
  kritis: {
    label: "Kritis",
    color: "#ef4444",
    stroke: "#b91c1c",
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-800",
    desc: "Prioritas monitoring lapang karena risiko panen relatif tinggi."
  }
};

const KEC_NAME_TO_CODE = Object.fromEntries(
  KecamatanList.map((k) => [k.nama.toUpperCase().replace(/\s+/g, " ").trim(), k.kode])
);
const KEC_CODE_SET = new Set(KecamatanList.map((k) => k.kode));

function normalizeRegionName(value?: string) {
  return (value || "").toUpperCase().replace(/\s+/g, " ").trim();
}

function resolveKecamatanCode(props?: AdministrativeProps) {
  if (!props) return undefined;
  const kode = String(props.kode_bmkg || props.kode || "").trim();
  if (KEC_CODE_SET.has(kode)) return kode;
  if (/^35\.09\.\d{2}/.test(kode)) return kode.slice(0, 8);
  if (/^\d{1,3}$/.test(kode)) {
    const official = GEOJSONKodeKecamatan[kode.padStart(3, "0")];
    if (official) return official;
  }
  const byKecamatan = KEC_NAME_TO_CODE[normalizeRegionName(props.WADMKC)];
  if (byKecamatan) return byKecamatan;
  const byName = KEC_NAME_TO_CODE[normalizeRegionName(props.NAMOBJ)];
  return byName;
}

function collectLngLat(geometry?: any): [number, number][] {
  const pairs: [number, number][] = [];
  const walk = (node: any) => {
    if (!Array.isArray(node)) return;
    if (typeof node[0] === "number" && typeof node[1] === "number") {
      pairs.push([node[0], node[1]]);
      return;
    }
    node.forEach(walk);
  };
  walk(geometry?.coordinates);
  return pairs;
}

function centroidFromGeometry(geometry?: any) {
  const coords = collectLngLat(geometry);
  if (!coords.length) return null;
  const sum = coords.reduce((acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }), { lng: 0, lat: 0 });
  return { lon: sum.lng / coords.length, lat: sum.lat / coords.length };
}

export default function App() {
  const [geo, setGeo] = useState<KecamatanFC | null>(null);
  const [rows, setRows] = useState<KecamatanRow[]>([]);
  const [selectedKode, setSelectedKode] = useState<string>("35.09.19");
  const [search, setSearch] = useState("");
  const [geoSource, setGeoSource] = useState("memuat layer administrasi");
  const [selectedLayerInfo, setSelectedLayerInfo] = useState<{
    namaWilayah: string;
    kecamatan: string;
    kodeWilayah: string;
    sumber: string;
  } | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

  // Current view: "guest" or "admin"
  const [currentPage, setCurrentPage] = useState<"guest" | "admin">("guest");

  // Derived state for the currently selected Kecamatan
  const selectedRow = rows.find(r => r.kode === selectedKode) || rows[0];

  // Custom hooks for LSTM model loading and weather synchronization
  const {
    modelStatus,
    modelInputMode,
    loadedModelShape,
    runPrediction
  } = useLstmModel(rows, setRows);

  const {
    syncing,
    lastSync,
    weatherLog,
    dbError,
    syncBmkgToFirestore
  } = useBmkgFirestore(setRows, runPrediction);

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("sipanen_admin_auth") === "true";
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    localStorage.setItem("sipanen_admin_auth", "true");
    setCurrentPage("admin");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("sipanen_admin_auth");
    setCurrentPage("guest");
  };

  // load geojson
  useEffect(() => {
    let cancelled = false;
    const loadAdministrativeLayer = async () => {
      for (const source of ["/jember.geojson", "/jember_kecamatan.geojson"]) {
        try {
          const response = await fetch(source);
          if (!response.ok) continue;
          const data = await response.json();
          if (data?.type === "FeatureCollection" && Array.isArray(data.features) && data.features.length > 0) {
            if (!cancelled) {
              setGeo(data);
              setGeoSource(source.replace("/", ""));
            }
            return;
          }
        } catch {}
      }
      if (!cancelled) {
        setGeo({ type: "FeatureCollection", features: [] });
        setGeoSource("tidak ada GeoJSON valid");
      }
    };
    loadAdministrativeLayer();
    return () => { cancelled = true; };
  }, []);

  // init rows with Firestore features if available
  useEffect(() => {
    if (!geo) return;
    const initializeRows = async () => {
      let firestoreFeats: Record<string, Record<string, number>> = {};
      try {
        firestoreFeats = await fetchKecamatanFeatures();
      } catch (err) {
        console.warn("Could not fetch features from Firestore (running offline/fallback):", err);
      }

      const centroidBucket: Record<string, { lat: number, lon: number, count: number }> = {};
      geo.features.forEach((f) => {
        const code = resolveKecamatanCode(f.properties);
        const centroid = centroidFromGeometry(f.geometry);
        if (!code || !centroid) return;
        if (!centroidBucket[code]) centroidBucket[code] = { lat: 0, lon: 0, count: 0 };
        centroidBucket[code].lat += centroid.lat;
        centroidBucket[code].lon += centroid.lon;
        centroidBucket[code].count += 1;
      });
      const featureIndex: Record<string, { lat: number, lon: number }> = {};
      Object.entries(centroidBucket).forEach(([code, value]) => {
        featureIndex[code] = { lat: value.lat / value.count, lon: value.lon / value.count };
      });

      const init: KecamatanRow[] = KecamatanList.map((k, idx) => {
        const pos = featureIndex[k.kode] || { lat: -8.18 + (idx % 6) * 0.07, lon: 113.65 + Math.floor(idx / 6) * 0.08 };
        const feats = firestoreFeats[k.kode] || makeInitialFeatures(k.nama, idx);
        const predH = heuristicPredict(feats);
        return {
          kode: k.kode,
          nama: k.nama,
          kecamatan: k.nama,
          lat: pos.lat,
          lon: pos.lon,
          features: feats,
          prediksi: predH,
          confidence: 0.82 + (idx % 7) * 0.022,
          trend: (idx % 3 === 0 ? "naik" : idx % 3 === 1 ? "stabil" : "turun") as any,
          luasHa: feats["luas tanam"],
          predictions12: []
        };
      });
      setRows(init);
    };

    initializeRows();
  }, [geo]);

  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => r.nama.toLowerCase().includes(s) || r.kode.includes(s));
  }, [rows, search]);

  const totals = useMemo(() => {
    const tot = rows.reduce((s, r) => s + r.prediksi, 0);
    const avg = rows.length ? tot / rows.length : 0;
    const top = [...rows].sort((a, b) => b.prediksi - a.prediksi)[0];
    return { tot, avg, top };
  }, [rows]);

  const productivityBreaks = useMemo(() => {
    const values = rows
      .map((r) => r.prediksi / Math.max(1, r.luasHa))
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    const pick = (ratio: number) => values[Math.min(values.length - 1, Math.max(0, Math.floor(values.length * ratio)))] || 0;
    return { critical: pick(0.33), warning: pick(0.66) };
  }, [rows]);

  const getRowStatus = (row?: KecamatanRow): HarvestStatus => {
    if (!row) return "waspada";
    const prod = row.prediksi / Math.max(1, row.luasHa);
    const severeWeather = row.features.suhu_rata2_c > 32 || row.features.kelembaban_persen > 90;
    const moderateWeather = row.features.suhu_rata2_c > 30.5 || row.features.kelembaban_persen > 86;
    if (prod <= productivityBreaks.critical || severeWeather) return "kritis";
    if (prod <= productivityBreaks.warning || moderateWeather || row.trend === "turun") return "waspada";
    return "aman";
  };

  const statusCounts = useMemo(() => rows.reduce((acc, row) => {
    const status = getRowStatus(row);
    acc[status] += 1;
    return acc;
  }, { aman: 0, waspada: 0, kritis: 0 } as Record<HarvestStatus, number>), [rows, productivityBreaks]);

  const selectedStatus = selectedRow ? getRowStatus(selectedRow) : "waspada";
  const selectedStatusMeta = STATUS_META[selectedStatus];

  useEffect(() => {
    if (!geo || !mapRef.current || !geo.features.length) return;
    const layer = L.geoJSON(geo as any);
    const bounds = layer.getBounds();
    if (bounds.isValid()) mapRef.current.fitBounds(bounds, { padding: [24, 24] });
  }, [geo]);

  const geoStyle = (feature?: GeoJSON.Feature<any, AdministrativeProps>) => {
    const code = resolveKecamatanCode(feature?.properties);
    const row = rows.find(r => r.kode === code);
    const status = getRowStatus(row);
    const meta = STATUS_META[status];
    return {
      fillColor: row ? meta.color : "#cbd5e1",
      weight: selectedKode === code ? 3 : 1.15,
      opacity: 1,
      color: selectedKode === code ? "#0f172a" : row ? meta.stroke : "#94a3b8",
      dashArray: selectedKode === code ? "" : "2 2",
      fillOpacity: selectedKode === code ? 0.86 : 0.72,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature<any, AdministrativeProps>, layer: L.Layer) => {
    const props = feature.properties || {};
    const code = resolveKecamatanCode(props);
    const row = rows.find(r => r.kode === code);
    const status = getRowStatus(row);
    const meta = STATUS_META[status];
    const namaWilayah = String(props.NAMOBJ || row?.nama || "Wilayah administrasi");
    const kecamatan = row?.nama || String(props.WADMKC || "Kecamatan belum cocok");
    const kodeWilayah = String(props.kode_bmkg || props.kode || code || "-");
    const remark = String(props.REMARK || (props.NAMOBJ ? "Desa/Kelurahan" : "Kecamatan"));
    layer.on({
      click: () => {
        if (code) setSelectedKode(code);
        setSelectedLayerInfo({ namaWilayah, kecamatan, kodeWilayah, sumber: geoSource });
        (layer as any).openPopup?.();
      },
      mouseover: (e: any) => { e.target.setStyle({ weight: 2.2, fillOpacity: 0.93 }); },
      mouseout: (e: any) => { geoJsonRef.current?.resetStyle(e.target); }
    });
    if (row) {
      layer.bindPopup(
        `<div style="font-family:Inter,sans-serif;min-width:230px;">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em;">${remark}</div>
          <div style="font-size:16px;font-weight:800;color:#0f172a;margin-top:2px;">${namaWilayah}</div>
          <div style="font-size:12px;color:#475569;margin-top:2px;">Kecamatan ${kecamatan} • ${kodeWilayah}</div>
          <div style="display:inline-flex;align-items:center;gap:7px;margin-top:10px;padding:6px 9px;border-radius:999px;background:${meta.color}22;color:${meta.stroke};font-weight:800;font-size:12px;border:1px solid ${meta.color}55;">
            <span style="width:9px;height:9px;border-radius:999px;background:${meta.color};display:inline-block;"></span>${meta.label}
          </div>
          <div style="margin-top:10px;font-size:12px;line-height:1.55;color:#334155;">
            Prediksi: <b>${row.prediksi.toLocaleString("id-ID")} ton</b><br/>
            Produktivitas: <b>${(row.prediksi / Math.max(1, row.luasHa)).toFixed(2)} ton/ha</b><br/>
            Luas tanam: ${row.luasHa} ha<br/>
            Cuaca: ${row.features.suhu_rata2_c?.toFixed(1) ?? "-"}°C, RH ${Math.round(row.features.kelembaban_persen) ?? "-"}%
          </div>
        </div>`
      );
      layer.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:12px;">
          <b>${namaWilayah}</b><br/>
          Kecamatan: ${row.nama}<br/>
          Status: <b style="color:${meta.stroke}">${meta.label}</b><br/>
          Prediksi: <b>${row.prediksi.toLocaleString("id-ID")} ton</b><br/>
          T: ${row.features.suhu_rata2_c?.toFixed(1) ?? "-"}°C
        </div>`, { sticky: true }
      );
    }
  };

  // Render Admin Dashboard if Admin page is active and authenticated
  if (currentPage === "admin" && isAuthenticated) {
    return (
      <AdminDashboard
        rows={rows}
        setRows={setRows}
        syncing={syncing}
        lastSync={lastSync}
        weatherLog={weatherLog}
        dbError={dbError}
        syncBmkgToFirestore={syncBmkgToFirestore}
        runPrediction={runPrediction}
        onBack={() => setCurrentPage("guest")}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f4] text-slate-800">
      <header className="sticky top-0 z-900 backdrop-blur bg-[#f6f8f4]/85 border-b border-emerald-900/10">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center font-black shadow shadow-emerald-700/25">SJ</div>
            <div>
              <div className="font-[700] text-[17px] tracking-tight text-emerald-950">SiPanen • Jember Harvest AI</div>
              <div className="text-[11.5px] text-emerald-800/70 -mt-0.5">Dashboard prediksi panen per Kecamatan – Kabupaten Jember, Jawa Timur</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <span className={`px-2.5 py-1 rounded-full border ${modelStatus === "ready" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : modelStatus === "fallback" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
              Model: {modelStatus === "ready" ? "TensorFlow.js ✔" : modelStatus === "fallback" ? "Heuristik" : "memuat…"}
            </span>
            <span className="text-slate-500 hidden md:inline">
              {modelInputMode === "sequence_3x16" ? "LSTM 3x16" : "Flat 16"} • shape {loadedModelShape} • Firestore Live
            </span>
            {isAuthenticated ? (
              <button
                onClick={() => setCurrentPage("admin")}
                className="px-3.5 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-[12.5px] font-semibold shadow-sm transition-all"
              >
                Dashboard Admin
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[12.5px] font-semibold transition-all"
              >
                Login Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {dbError && (
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 mt-4 animate-fade-in">
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-[12.5px] font-medium flex items-start gap-2.5 shadow-sm">
            <span className="text-[15px] pt-0.5">⚠️</span>
            <div>
              <span className="font-semibold">Kesalahan Koneksi Firestore:</span> {dbError}.<br />
              Aplikasi berjalan dalam mode offline/fallback lokal. Untuk menyinkronkan data cuaca BMKG dan menyimpan input fitur ke database, pastikan Anda telah membuat database Firestore bernama <code>(default)</code> di Firebase Console.
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-7 space-y-7">
        {/* KPI */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[22px] border border-emerald-900/10 bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-emerald-700/80">Total Prediksi Kabupaten</div>
            <div className="text-[28px] font-[800] text-emerald-950 mt-1">{totals.tot.toLocaleString("id-ID", { maximumFractionDigits: 0 })} <span className="text-[15px] font-[600] text-emerald-700">ton</span></div>
            <div className="text-[11.5px] text-slate-500 mt-1">31 kecamatan • {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</div>
          </div>
          <div className="rounded-[22px] border border-emerald-900/10 bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-emerald-700/80">Rata-rata / Kecamatan</div>
            <div className="text-[28px] font-[800] text-emerald-950 mt-1">{totals.avg.toFixed(0)} <span className="text-[15px] font-[600] text-emerald-700">ton</span></div>
            <div className="text-[11.5px] text-slate-500 mt-1">Produktivitas ~ {(totals.avg / (selectedRow?.luasHa || 260)).toFixed(2)} ton/ha</div>
          </div>
          <div className="rounded-[22px] border border-emerald-900/10 bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-emerald-700/80">Tertinggi</div>
            <div className="text-[20px] font-[800] text-emerald-950 mt-1">{totals.top?.nama || "-"}</div>
            <div className="text-[13.5px] text-emerald-700 font-[650]">{totals.top ? totals.top.prediksi.toLocaleString("id-ID") + " ton" : "-"}</div>
          </div>
          <div className="rounded-[22px] border border-sky-50 to-emerald-50 p-4 shadow-sm bg-gradient-to-br from-sky-50 to-emerald-50">
            <div className="text-[11px] uppercase tracking-wider text-sky-800/80">Cuaca Jember (BMKG)</div>
            <div className="text-[14.5px] font-[700] text-sky-950 mt-1">
              {selectedRow ? `${selectedRow.features.suhu_rata2_c?.toFixed(1) ?? "-"}°C · ${Math.round(selectedRow.features.kelembaban_persen) ?? "-"}% RH` : "-"}
            </div>
            <div className="text-[11.5px] text-sky-900/75 mt-1">
              Curah Hujan {selectedRow?.features.curah_hujan_mm?.toFixed?.(1) ?? "-"} mm<br />
              {lastSync ? "Sync: " + lastSync.toLocaleString("id-ID") : "Belum sync Firestore"}
            </div>
          </div>
        </section>

        {/* Map + side */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.55fr_0.95fr] gap-5">
          <div className="rounded-[26px] border border-emerald-900/10 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 text-[12.5px]">
              <div>
                <div className="font-[650] text-emerald-950">Layer Wilayah Administrasi Jember</div>
                <div className="text-[10.5px] text-slate-500 mt-0.5">Klik polygon desa/kecamatan untuk membuka detail prediksi dan status.</div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 text-[10.5px] text-slate-600">
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#22c55e] border border-emerald-700"></span>Aman {statusCounts.aman}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#f59e0b] border border-amber-700"></span>Waspada {statusCounts.waspada}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#ef4444] border border-rose-700"></span>Kritis {statusCounts.kritis}</span>
              </div>
            </div>
            <div className="h-[520px]">
              <MapContainer
                center={[-8.27, 113.71]}
                zoom={10}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef as any}
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {geo && (
                  <GeoJSON
                    key={rows.map(r => r.prediksi).join("-").slice(0, 200)}
                    data={geo as any}
                    style={geoStyle as any}
                    onEachFeature={onEachFeature as any}
                    ref={geoJsonRef as any}
                  />
                )}
              </MapContainer>
            </div>
            <div className="px-4 py-[10px] text-[11px] text-slate-500 border-t border-slate-100 flex flex-wrap gap-x-5 gap-y-1">
              <span>Data batas administrasi aktif: {geoSource}</span>
              <span>Kolom cocok: NAMOBJ, WADMKC, WADMKK, WADMPR, kode</span>
              <span>Model input: {KANDIDAT_FEATURES.length} fitur</span>
              <span>Koordinat pusat: -8.17, 113.70</span>
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="rounded-[24px] border border-emerald-900/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-[700] text-emerald-950">Detail Kecamatan</div>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="cari kecamatan…"
                  className="text-[12px] border border-slate-300 rounded-xl px-3 py-[7px] w-[155px] focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              {selectedRow && (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[20px] font-[800] text-emerald-950">{selectedRow.nama}</div>
                      <div className="text-[11px] text-slate-500">{selectedRow.kode} • {selectedRow.lat.toFixed(3)}, {selectedRow.lon.toFixed(3)}</div>
                    </div>
                    <div className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-[800] ${selectedStatusMeta.bg} ${selectedStatusMeta.text}`}>
                      {selectedStatusMeta.label}
                    </div>
                  </div>
                  {selectedLayerInfo && (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11.5px] text-slate-700">
                      <div className="font-[750] text-slate-950">Layer diklik: {selectedLayerInfo.namaWilayah}</div>
                      <div>Kecamatan {selectedLayerInfo.kecamatan} • kode {selectedLayerInfo.kodeWilayah}</div>
                      <div className="text-slate-500">Sumber: {selectedLayerInfo.sumber}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 py-2">
                      <div className="text-[10px] text-emerald-700">Prediksi</div>
                      <div className="font-[750] text-emerald-900 text-[15px]">{selectedRow.prediksi.toFixed(0)}<span className="text-[11px]">t</span></div>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 py-2">
                      <div className="text-[10px] text-slate-600">Luas Tanam</div>
                      <div className="font-[700] text-slate-900 text-[15px]">{selectedRow.luasHa}<span className="text-[11px]">ha</span></div>
                    </div>
                    <div className="rounded-xl bg-sky-50 border border-sky-100 py-2">
                      <div className="text-[10px] text-sky-700">Conf.</div>
                      <div className="font-[700] text-sky-900 text-[15px]">{Math.round(selectedRow.confidence * 100)}%</div>
                    </div>
                  </div>
                  <div className="mt-3 text-[11.5px] leading-relaxed text-slate-600">
                    Trend: <span className={selectedRow.trend === "naik" ? "text-emerald-700 font-[600]" : selectedRow.trend === "turun" ? "text-rose-600 font-[600]" : "text-slate-700 font-[600]"}>{selectedRow.trend}</span> •
                    Panen lag1 {selectedRow.features.panen_lag_1} t • lag2 {selectedRow.features.panen_lag_2} t
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { const idx = filteredRows.findIndex(r => r.kode === selectedRow.kode); const next = filteredRows[(idx + 1) % filteredRows.length]; if (next) setSelectedKode(next.kode); }} className="w-full text-[12px] py-[9px] rounded-xl border border-slate-300 hover:bg-slate-50 text-center font-medium">Next Kecamatan →</button>
                  </div>
                </div>
              )}
              <div className="mt-4 max-h-[260px] overflow-auto pr-1">
                <table className="w-full text-[11.5px]">
                  <thead className="text-slate-500 sticky top-0 bg-white">
                    <tr><th className="text-left py-[6px]">Kecamatan</th><th className="text-right">Ton</th><th className="text-right">Ha</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(0, 31).map(r => (
                      <tr key={r.kode} className={`border-t border-slate-100 ${r.kode === selectedKode ? "bg-emerald-50/80" : "hover:bg-slate-50"}`}>
                        <td className="py-[7px] pr-2">
                          <div className="font-[600] text-emerald-950">{r.nama}</div>
                          <div className="text-[10px] text-slate-500">{r.kode}</div>
                        </td>
                        <td className="text-right font-[680]">{r.prediksi.toFixed(0)}</td>
                        <td className="text-right text-slate-600">{r.luasHa}</td>
                        <td className="text-right">
                          <button onClick={() => setSelectedKode(r.kode)} className="text-emerald-700 text-[11px] hover:underline">buka</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Prediction Chart Section */}
        <section>
          <PredictionChart
            data={selectedRow?.predictions12 || []}
            kecamatanNama={selectedRow?.nama || "Kecamatan"}
          />
        </section>

        <footer className="text-[11px] text-slate-500 text-center pb-6">
          SiPanen Jember • Deep Learning (TensorFlow.js) • 16 input features • BMKG → Firestore auto-sync 3 jam • © 2026 Dinas Pertanian Jember – demo AI
        </footer>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <style>{`
        .leaflet-container { background:#e9f3e8; font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; }
        .leaflet-control-attribution { font-size:10px; }
      `}</style>
    </div>
  );
}