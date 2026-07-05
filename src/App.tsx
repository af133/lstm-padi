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
import { getLatestDataPerKecamatan } from "./utils/adminUtils";
import { AuthModal } from "./components/AuthModal";
import { PredictionChart } from "./components/PredictionChart";
import { AdminDashboard } from "./components/AdminDashboard";
import { Navigation } from "./components/Navigation";
import { HomePage } from "./components/HomePage";
import { Footer } from "./components/Footer";

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

// ---------------------------------------------------------------------------
// Palet "Ledger Sawah": kertas krem, hijau sawah, emas padi, tanah liat.
// ---------------------------------------------------------------------------
const STATUS_META: Record<HarvestStatus, { label: string; color: string; stroke: string; bg: string; text: string; desc: string }> = {
  aman: {
    label: "Aman",
    color: "#22C55E",
    stroke: "#15803D",
    bg: "bg-[#DCFCE7] border-[#BBF7D0]",
    text: "text-[#15803D]",
    desc: "Prediksi panen dan cuaca masih mendukung."
  },
  waspada: {
    label: "Waspada",
    color: "#F59E0B",
    stroke: "#B45309",
    bg: "bg-[#FEF3C7] border-[#FDE68A]",
    text: "text-[#6B5410]"
    ,desc: "Ada penurunan produktivitas atau indikasi cuaca yang perlu dipantau."
  },
  kritis: {
    label: "Kritis",
    color: "#F43F5E",
    stroke: "#BE123C",
    bg: "bg-[#FFE4E6] border-[#FECDD3]",
    text: "text-[#BE123C]",
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

// Divider bergaya garis kontur peta topografi — jadi signature visual halaman ini.
function ContourDivider() {
  return (
    <div className="w-full overflow-hidden h-[18px] opacity-70 select-none pointer-events-none" aria-hidden="true">
      <svg viewBox="0 0 1200 18" preserveAspectRatio="none" className="w-full h-full">
        <path d="M0,9 C60,2 120,16 180,9 C240,2 300,16 360,9 C420,2 480,16 540,9 C600,2 660,16 720,9 C780,2 840,16 900,9 C960,2 1020,16 1080,9 C1120,4 1160,14 1200,9"
          fill="none" stroke="#F59E0B" strokeWidth="1" strokeOpacity="0.55" />
        <path d="M0,13 C60,7 120,19 180,13 C240,7 300,19 360,13 C420,7 480,19 540,13 C600,7 660,19 720,13 C780,7 840,19 900,13 C960,7 1020,19 1080,13 C1120,9 1160,17 1200,13"
          fill="none" stroke="#22C55E" strokeWidth="1" strokeOpacity="0.35" />
      </svg>
    </div>
  );
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

  const [currentPage, setCurrentPage] = useState<"home" | "peta" | "admin" | "guest">("home");

  const selectedRow = rows.find(r => r.kode === selectedKode) || rows[0];

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
    setCurrentPage("home");
  };

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
      fillColor: row ? meta.color : "#E2E8F0",
      weight: selectedKode === code ? 3 : 1.15,
      opacity: 1,
      color: selectedKode === code ? "#1E293B" : row ? meta.stroke : "#94A3B8",
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
          <div style="font-size:10.5px;color:#64748B;text-transform:uppercase;letter-spacing:.1em;font-weight:600;">${remark}</div>
          <div style="font-family:'Fraunces',serif;font-size:17px;font-weight:700;color:#1E293B;margin-top:2px;">${namaWilayah}</div>
          <div style="font-size:12px;color:#475569;margin-top:2px;">Kecamatan ${kecamatan} • <span style="font-family:'JetBrains Mono',monospace;">${kodeWilayah}</span></div>
          <div style="display:inline-flex;align-items:center;gap:7px;margin-top:10px;padding:6px 10px;border-radius:999px;background:${meta.color}1f;color:${meta.stroke};font-weight:700;font-size:12px;border:1px solid ${meta.color}55;">
            <span style="width:8px;height:8px;border-radius:999px;background:${meta.color};display:inline-block;"></span>${meta.label}
          </div>
          <div style="margin-top:10px;font-size:12px;line-height:1.6;color:#334155;font-family:'JetBrains Mono',monospace;">
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

  // Home Page
  if (currentPage === "home") {
    return (
      <div className="min-h-screen bg-white">
        <Navigation
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page as any)}
          isAuthenticated={isAuthenticated}
          onAuthModalOpen={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        <HomePage
          onNavigate={(page) => setCurrentPage(page as any)}
          onAuthModalOpen={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    );
  }

  // Admin Dashboard
  if (currentPage === "admin" && isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navigation
          currentPage={currentPage}
          onNavigate={(page) => setCurrentPage(page as any)}
          isAuthenticated={isAuthenticated}
          onAuthModalOpen={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
        />
        <AdminDashboard
          rows={rows}
          setRows={setRows}
          syncing={syncing}
          lastSync={lastSync}
          weatherLog={weatherLog}
          dbError={dbError}
          syncBmkgToFirestore={syncBmkgToFirestore}
          runPrediction={runPrediction}
          onBack={() => setCurrentPage("home")}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // Map Page (Peta)
  return (
    <div className="min-h-screen text-[#1E293B]" style={{ background: "linear-gradient(160deg, #F0FDF4 0%, #F6FEF9 35%, #F0F9FF 100%)", fontFamily: "'Inter', ui-sans-serif, system-ui" }}>
      <Navigation
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page as any)}
        isAuthenticated={isAuthenticated}
        onAuthModalOpen={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />
      <header className="hidden"></header>

      {dbError && (
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 mt-4 animate-fade-in">
          <div className="bg-[#FFE4E6] border border-[#FECDD3] text-[#BE123C] px-4 py-3 rounded-2xl text-[12.5px] font-medium flex items-start gap-2.5 shadow-sm">
            <span className="text-[15px] pt-0.5">⚠️</span>
            <div>
              <span className="font-semibold">Kesalahan Koneksi Firestore:</span> {dbError}.<br />
              Aplikasi berjalan dalam mode offline/fallback lokal. Untuk menyinkronkan data cuaca BMKG dan menyimpan input fitur ke database, pastikan Anda telah membuat database Firestore bernama <code className="font-mono">(default)</code> di Firebase Console.
            </div>
          </div>
        </div>
      )}

      <main className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-7 space-y-8">
        {/* KPI */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[20px] border border-[#DCF2E3] bg-white/80 p-4 shadow-[0_1px_2px_rgba(45,42,31,0.04)] border-l-4 border-l-[#22C55E]">
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#475569] font-semibold">Total Prediksi Kabupaten</div>
            <div className="text-[27px] mt-1 text-[#15803D]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
              {totals.tot.toLocaleString("id-ID", { maximumFractionDigits: 0 })} <span className="text-[14px] font-medium text-[#22C55E]">ton</span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">31 kecamatan • {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</div>
          </div>
          <div className="rounded-[20px] border border-[#DCF2E3] bg-white/80 p-4 shadow-[0_1px_2px_rgba(45,42,31,0.04)] border-l-4 border-l-[#F59E0B]">
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#475569] font-semibold">Rata-rata / Kecamatan</div>
            <div className="text-[27px] mt-1 text-[#6B5410]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
              {totals.avg.toFixed(0)} <span className="text-[14px] font-medium text-[#F59E0B]">ton</span>
            </div>
            <div className="text-[11px] text-[#64748B] mt-1">Produktivitas ~ {(totals.avg / (selectedRow?.luasHa || 260)).toFixed(2)} ton/ha</div>
          </div>
          <div className="rounded-[20px] border border-[#DCF2E3] bg-white/80 p-4 shadow-[0_1px_2px_rgba(45,42,31,0.04)] border-l-4 border-l-[#0EA5E9]">
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#475569] font-semibold">Tertinggi</div>
            <div className="text-[19px] mt-1 text-[#1E293B]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}>{totals.top?.nama || "-"}</div>
            <div className="text-[13px] text-[#0EA5E9] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{totals.top ? totals.top.prediksi.toLocaleString("id-ID") + " ton" : "-"}</div>
          </div>
          <div className="rounded-[20px] border border-[#BAE6FD] p-4 shadow-[0_1px_2px_rgba(45,42,31,0.04)] bg-gradient-to-br from-[#E0F2FE] to-[#ECFDF5]">
            <div className="text-[10.5px] uppercase tracking-[0.08em] text-[#0369A1] font-semibold">Cuaca {selectedRow?.nama || "Kecamatan"} (BMKG)</div>
            <div className="text-[14px] mt-1 text-[#0284C7] font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {selectedRow ? `${selectedRow.features.suhu_rata2_c?.toFixed(1) ?? "-"}°C · ${Math.round(selectedRow.features.kelembaban_persen) ?? "-"}% RH` : "-"}
            </div>
            <div className="text-[11px] text-[#0369A1]/80 mt-1">
              Curah Hujan {selectedRow?.features.curah_hujan_mm?.toFixed?.(1) ?? "-"} mm<br />
              {lastSync ? "Sync: " + lastSync.toLocaleString("id-ID") : "Belum sync Firestore"}
            </div>
          </div>
        </section>

        <ContourDivider />

        {/* Map + side */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.55fr_0.95fr] gap-5">
          <div className="rounded-[24px] border border-[#DCF2E3] bg-white/80 shadow-[0_1px_3px_rgba(45,42,31,0.06)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E3F6E8] text-[12.5px]">
              <div>
                <div className="text-[#15803D]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}>Layer Wilayah Administrasi Jember</div>
                <div className="text-[10.5px] text-[#64748B] mt-0.5">Klik polygon desa/kecamatan untuk membuka detail prediksi dan status.</div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2 text-[10.5px] text-[#334155]">
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: STATUS_META.aman.color }}></span>Aman {statusCounts.aman}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: STATUS_META.waspada.color }}></span>Waspada {statusCounts.waspada}</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: STATUS_META.kritis.color }}></span>Kritis {statusCounts.kritis}</span>
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
            <div className="px-4 py-[10px] text-[11px] text-[#64748B] border-t border-[#E3F6E8] flex flex-wrap gap-x-5 gap-y-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              <span>Data batas administrasi aktif: {geoSource}</span>
              <span>Kolom cocok: NAMOBJ, WADMKC, WADMKK, WADMPR, kode</span>
              <span>Model input: {KANDIDAT_FEATURES.length} fitur</span>
              <span>Koordinat pusat: -8.17, 113.70</span>
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-4">
            <div className="rounded-[22px] border border-[#DCF2E3] bg-white/80 p-4 shadow-[0_1px_3px_rgba(45,42,31,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[#15803D]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}>Detail Kecamatan</div>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="cari kecamatan…"
                  className="text-[12px] border border-[#BBF7D0] rounded-xl px-3 py-[7px] w-[155px] bg-[#F0FDF4] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/25"
                />
              </div>
              {selectedRow && (
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[19px] text-[#1E293B]" style={{ fontFamily: "'Fraunces', serif", fontWeight: 700 }}>{selectedRow.nama}</div>
                      <div className="text-[11px] text-[#64748B]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selectedRow.kode} • {selectedRow.lat.toFixed(3)}, {selectedRow.lon.toFixed(3)}</div>
                    </div>
                    <div className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${selectedStatusMeta.bg} ${selectedStatusMeta.text}`}>
                      {selectedStatusMeta.label}
                    </div>
                  </div>
                  {selectedStatus === "kritis" && (
                    <div className="mt-3 rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] px-3 py-2 text-[11.5px] text-[#9F1239] font-semibold">
                      ⚠️ Prioritas utama mendapatkan pupuk
                    </div>
                  )}
                  {selectedStatus === "waspada" && (
                    <div className="mt-3 rounded-lg border border-[#FCD34D] bg-[#FFFACD] px-3 py-2 text-[11.5px] text-[#854D0E] font-semibold">
                      ⚡ Segera mendapatkan pupuk
                    </div>
                  )}
                  {selectedStatus === "aman" && (
                    <div className="mt-3 rounded-lg border border-[#BBEF86] bg-[#ECFDF5] px-3 py-2 text-[11.5px] text-[#166534] font-semibold">
                      ✓ Kurang prioritas untuk pupuk
                    </div>
                  )}
                  {selectedLayerInfo && (
                    <div className="mt-3 rounded-2xl border border-[#E3F6E8] bg-[#F0FDF4] px-3 py-2 text-[11.5px] text-[#334155]">
                      <div className="font-semibold text-[#1E293B]">Layer diklik: {selectedLayerInfo.namaWilayah}</div>
                      <div>Kecamatan {selectedLayerInfo.kecamatan} • kode {selectedLayerInfo.kodeWilayah}</div>
                      <div className="text-[#64748B]">Sumber: {selectedLayerInfo.sumber}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] py-2">
                      <div className="text-[10px] text-[#22C55E] font-medium">Prediksi</div>
                      <div className="text-[#15803D] text-[15px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{selectedRow.prediksi.toFixed(0)}<span className="text-[11px]">t</span></div>
                    </div>
                    <div className="rounded-xl bg-[#ECFDF5] border border-[#DCF2E3] py-2">
                      <div className="text-[10px] text-[#64748B] font-medium">Luas Tanam</div>
                      <div className="text-[#1E293B] text-[15px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{selectedRow.luasHa}<span className="text-[11px]">ha</span></div>
                    </div>
                    <div className="rounded-xl bg-[#E0F2FE] border border-[#BAE6FD] py-2">
                      <div className="text-[10px] text-[#0369A1] font-medium">Conf.</div>
                      <div className="text-[#0284C7] text-[15px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{Math.round(selectedRow.confidence * 100)}%</div>
                    </div>
                  </div>
                  <div className="mt-3 text-[11.5px] leading-relaxed text-[#475569]">
                    Trend: <span className={selectedRow.trend === "naik" ? "text-[#15803D] font-semibold" : selectedRow.trend === "turun" ? "text-[#BE123C] font-semibold" : "text-[#334155] font-semibold"}>{selectedRow.trend}</span> •
                    Panen lag1 {selectedRow.features.panen_lag_1} t • lag2 {selectedRow.features.panen_lag_2} t
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => { const idx = filteredRows.findIndex(r => r.kode === selectedRow.kode); const next = filteredRows[(idx + 1) % filteredRows.length]; if (next) setSelectedKode(next.kode); }} className="w-full text-[12px] py-[9px] rounded-xl border border-[#BBF7D0] hover:bg-[#F0FDF4] text-center font-medium text-[#334155] transition-colors">Kecamatan berikutnya →</button>
                  </div>
                </div>
              )}
              <div className="mt-4 max-h-[260px] overflow-auto pr-1">
                <table className="w-full text-[11.5px]">
                  <thead className="text-[#64748B] sticky top-0 bg-white/95">
                    <tr><th className="text-left py-[6px] font-semibold uppercase tracking-wide text-[10px]">Kecamatan</th><th className="text-right font-semibold uppercase tracking-wide text-[10px]">Ton</th><th className="text-right font-semibold uppercase tracking-wide text-[10px]">Ha</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(0, 31).map(r => (
                      <tr key={r.kode} className={`border-t border-[#E3F6E8] ${r.kode === selectedKode ? "bg-[#DCFCE7]/70" : "hover:bg-[#F0FDF4]"}`}>
                        <td className="py-[7px] pr-2">
                          <div className="font-semibold text-[#15803D]">{r.nama}</div>
                          <div className="text-[10px] text-[#64748B]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.kode}</div>
                        </td>
                        <td className="text-right font-bold" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.prediksi.toFixed(0)}</td>
                        <td className="text-right text-[#475569]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.luasHa}</td>
                        <td className="text-right">
                          <button onClick={() => setSelectedKode(r.kode)} className="text-[#22C55E] text-[11px] hover:underline font-medium">buka</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <ContourDivider />

        {/* Prediction Chart Section */}
        <section>
          <PredictionChart
            data={selectedRow?.predictions12 || []}
            kecamatanNama={selectedRow?.nama || "Kecamatan"}
          />
        </section>

      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600..700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        .leaflet-container { background:#E7EEE1; font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; }
        .leaflet-control-attribution { font-size:10px; }
        .leaflet-popup-content-wrapper { border-radius: 14px; border: 1px solid #DCF2E3; box-shadow: 0 6px 20px rgba(45,42,31,0.14); }
        .leaflet-popup-tip { background: #fff; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in .25s ease-out; }
      `}</style>
    </div>
  );
}
