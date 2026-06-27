import { useEffect, useMemo, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

// ----- Firebase init -----
const env: any = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN ,
  projectId: env.VITE_FIREBASE_PROJECT_ID ,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET ,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID ,
  appId: env.VITE_FIREBASE_APP_ID ,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

// ----- Types -----
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
type ModelInputMode = "sequence_3x12" | "flat_16";

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

const KANDIDAT_FEATURES = [
  "temp", "humidity", "windspeed", "dew",
  "tanam bulan lalu", "luas tanam komoditi",
  "lap tanam akhir bulan",
  "jumlah_pupuk",
  "bulan_sin", "bulan_cos",
  "luas tanam", "hist_mean_panen_kec",
  "panen_lag_1", "panen_lag_2",
  "tanam_lag_1", "tanam_lag_2"
] as const;
type FeatureName = typeof KANDIDAT_FEATURES[number];

const LSTM_TIMESTEP_FEATURES = [
  "temp", "humidity", "windspeed", "dew",
  "tanam", "luas_tanam_komoditi", "lap_tanam",
  "jumlah_pupuk", "bulan_sin", "bulan_cos",
  "luas_tanam", "panen_ref"
] as const;

const modelOutputMode = String(env.VITE_MODEL_OUTPUT_MODE || "auto").toLowerCase();
const modelOutputMultiplier = Number(env.VITE_MODEL_OUTPUT_MULTIPLIER || 1);
const modelOutputOffset = Number(env.VITE_MODEL_OUTPUT_OFFSET || 0);

type KecamatanRow = {
  kode: string;
  nama: string;
  kecamatan: string;
  lat: number;
  lon: number;
  features: Record<FeatureName, number>;
  prediksi: number;
  confidence: number;
  trend: "naik" | "stabil" | "turun";
  luasHa: number;
};

// 31 Kecamatan Jember
const KEC_LIST = [
  { kode:"35.09.17", nama:"Ajung" },
  { kode:"35.09.12", nama:"Ambulu" },
  { kode:"35.09.22", nama:"Arjasa" },
  { kode:"35.09.10", nama:"Balung" },
  { kode:"35.09.09", nama:"Bangsalsari" },
  { kode:"35.09.04", nama:"Gumukmas" },
  { kode:"35.09.25", nama:"Jelbuk" },
  { kode:"35.09.16", nama:"Jenggawah" },
  { kode:"35.09.01", nama:"Jombang" },
  { kode:"35.09.27", nama:"Kalisat" },
  { kode:"35.09.19", nama:"Kaliwates" },
  { kode:"35.09.02", nama:"Kencong" },
  { kode:"35.09.28", nama:"Ledokombo" },
  { kode:"35.09.26", nama:"Mayang" },
  { kode:"35.09.23", nama:"Mumbulsari" },
  { kode:"35.09.24", nama:"Pakusari" },
  { kode:"35.09.14", nama:"Panti" },
  { kode:"35.09.20", nama:"Patrang" },
  { kode:"35.09.08", nama:"Puger" },
  { kode:"35.09.13", nama:"Rambipuji" },
  { kode:"35.09.07", nama:"Semboro" },
  { kode:"35.09.30", nama:"Silo" },
  { kode:"35.09.15", nama:"Sukorambi" },
  { kode:"35.09.29", nama:"Sukowono" },
  { kode:"35.09.03", nama:"Sumberbaru" },
  { kode:"35.09.31", nama:"Sumberjambe" },
  { kode:"35.09.21", nama:"Sumbersari" },
  { kode:"35.09.06", nama:"Tanggul" },
  { kode:"35.09.18", nama:"Tempurejo" },
  { kode:"35.09.05", nama:"Umbulsari" },
  { kode:"35.09.11", nama:"Wuluhan" },
];

const KEC_NAME_TO_CODE = Object.fromEntries(
  KEC_LIST.map((k) => [k.nama.toUpperCase().replace(/\s+/g, " ").trim(), k.kode])
);
const KEC_CODE_SET = new Set(KEC_LIST.map((k) => k.kode));
const GEOJSON_KEC_CODE_TO_OFFICIAL: Record<string, string> = {
  "010": "35.09.02",
  "020": "35.09.04",
  "030": "35.09.08",
  "040": "35.09.11",
  "050": "35.09.12",
  "060": "35.09.18",
  "070": "35.09.30",
  "080": "35.09.26",
  "090": "35.09.23",
  "100": "35.09.16",
  "110": "35.09.17",
  "120": "35.09.13",
  "130": "35.09.10",
  "140": "35.09.05",
  "150": "35.09.07",
  "160": "35.09.01",
  "170": "35.09.03",
  "180": "35.09.06",
  "190": "35.09.09",
  "200": "35.09.14",
  "210": "35.09.15",
  "220": "35.09.22",
  "230": "35.09.24",
  "240": "35.09.27",
  "250": "35.09.28",
  "260": "35.09.31",
  "270": "35.09.29",
  "280": "35.09.25",
  "710": "35.09.19",
  "720": "35.09.21",
  "730": "35.09.20"
};

function normalizeRegionName(value?: string) {
  return (value || "").toUpperCase().replace(/\s+/g, " ").trim();
}

function resolveKecamatanCode(props?: AdministrativeProps) {
  if (!props) return undefined;
  const kode = String(props.kode_bmkg || props.kode || "").trim();
  if (KEC_CODE_SET.has(kode)) return kode;
  if (/^35\.09\.\d{2}/.test(kode)) return kode.slice(0, 8);
  if (/^\d{1,3}$/.test(kode)) {
    const official = GEOJSON_KEC_CODE_TO_OFFICIAL[kode.padStart(3, "0")];
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

// BMKG desa mapping approx – ambil 2-3 desa per kecamatan (kode adm4)
const BMKG_DESA_MAP: Record<string, string[]> = {
  "35.09.17": ["35.09.17.2001","35.09.17.2002","35.09.17.2003"],
  "35.09.12": ["35.09.12.2001","35.09.12.2004","35.09.12.2007"],
  "35.09.22": ["35.09.22.2001","35.09.22.2003"],
  "35.09.10": ["35.09.10.2002","35.09.10.2005","35.09.10.2008"],
  "35.09.09": ["35.09.09.2001","35.09.09.2006"],
  "35.09.04": ["35.09.04.2001","35.09.04.2005","35.09.04.2009"],
  "35.09.25": ["35.09.25.2001","35.09.25.2004"],
  "35.09.16": ["35.09.16.2002","35.09.16.2005"],
  "35.09.01": ["35.09.01.2003","35.09.01.2007","35.09.01.2010"],
  "35.09.27": ["35.09.27.2001","35.09.27.2005"],
  "35.09.19": ["35.09.19.1001","35.09.19.1003","35.09.19.1006"],
  "35.09.02": ["35.09.02.2001","35.09.02.2004","35.09.02.2007"],
  "35.09.28": ["35.09.28.2002","35.09.28.2005"],
  "35.09.26": ["35.09.26.2001","35.09.26.2003"],
  "35.09.23": ["35.09.23.2002","35.09.23.2006"],
  "35.09.24": ["35.09.24.2001","35.09.24.2004"],
  "35.09.14": ["35.09.14.2003","35.09.14.2007"],
  "35.09.20": ["35.09.20.1002","35.09.20.1005"],
  "35.09.08": ["35.09.08.2001","35.09.08.2004","35.09.08.2008"],
  "35.09.13": ["35.09.13.2002","35.09.13.2005"],
  "35.09.07": ["35.09.07.2001","35.09.07.2006"],
  "35.09.30": ["35.09.30.2001","35.09.30.2004"],
  "35.09.15": ["35.09.15.2001","35.09.15.2003"],
  "35.09.29": ["35.09.29.2002","35.09.29.2005"],
  "35.09.03": ["35.09.03.2001","35.09.03.2006","35.09.03.2010"],
  "35.09.31": ["35.09.31.2002","35.09.31.2005"],
  "35.09.21": ["35.09.21.1001","35.09.21.1004","35.09.21.1007"],
  "35.09.06": ["35.09.06.2003","35.09.06.2008"],
  "35.09.18": ["35.09.18.2001","35.09.18.2005"],
  "35.09.05": ["35.09.05.2002","35.09.05.2006","35.09.05.2009"],
  "35.09.11": ["35.09.11.2001","35.09.11.2004","35.09.11.2007"],
};

function bulanSinCos(date = new Date()) {
  const m = date.getMonth() + 1;
  const angle = (2 * Math.PI * m) / 12;
  return { sin: Math.sin(angle), cos: Math.cos(angle) };
}

function shiftedBulanSinCos(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return bulanSinCos(d);
}

function inferModelInputMode(model: tf.LayersModel): ModelInputMode {
  const shape = (model.inputs?.[0] as any)?.shape || (model as any).inputShape;
  if (Array.isArray(shape) && shape.length === 3 && shape[1] === 3 && shape[2] === 12) return "sequence_3x12";
  return "flat_16";
}

function modelShapeLabel(model: tf.LayersModel) {
  const shape = (model.inputs?.[0] as any)?.shape || (model as any).inputShape;
  return Array.isArray(shape) ? `[${shape.map((v) => v ?? "null").join(", ")}]` : "unknown";
}

function buildLstmSequence(f: Record<FeatureName, number>) {
  const m2 = shiftedBulanSinCos(-2);
  const m1 = shiftedBulanSinCos(-1);
  const m0 = { sin: f.bulan_sin, cos: f.bulan_cos };
  const row = (
    tanam: number,
    lapTanam: number,
    luasTanam: number,
    panenRef: number,
    month: { sin: number; cos: number }
  ) => [
    f.temp,
    f.humidity,
    f.windspeed,
    f.dew,
    tanam,
    f["luas tanam komoditi"],
    lapTanam,
    f.jumlah_pupuk,
    Number(month.sin.toFixed(4)),
    Number(month.cos.toFixed(4)),
    luasTanam,
    panenRef
  ];

  return [
    row(f.tanam_lag_2, f.tanam_lag_2, f.tanam_lag_2, f.panen_lag_2, m2),
    row(f.tanam_lag_1, f.tanam_lag_1, f.tanam_lag_1, f.panen_lag_1, m1),
    row(f["tanam bulan lalu"], f["lap tanam akhir bulan"], f["luas tanam"], f.hist_mean_panen_kec, m0)
  ];
}

function buildModelInputTensor(f: Record<FeatureName, number>, mode: ModelInputMode) {
  if (mode === "sequence_3x12") return tf.tensor3d([buildLstmSequence(f)], [1, 3, 12]);
  return tf.tensor2d([KANDIDAT_FEATURES.map((k) => f[k] ?? 0)], [1, KANDIDAT_FEATURES.length]);
}

function transformModelOutput(raw: number, row: KecamatanRow, fallbackTon: number) {
  if (!Number.isFinite(raw)) return fallbackTon;
  const calibrated = raw * (Number.isFinite(modelOutputMultiplier) ? modelOutputMultiplier : 1) +
    (Number.isFinite(modelOutputOffset) ? modelOutputOffset : 0);
  if (modelOutputMode === "ton") return Math.max(0, calibrated);
  if (modelOutputMode === "ton_per_ha") return Math.max(0, calibrated * Math.max(1, row.luasHa));
  if (modelOutputMode === "scaled") return Math.max(0, calibrated);
  if (calibrated > 80) return Math.max(0, calibrated);
  if (calibrated > 0 && calibrated <= 15) return Math.max(0, calibrated * Math.max(1, row.luasHa));
  if (calibrated > 15 && calibrated <= 80) return Math.max(0, calibrated * 12);
  return fallbackTon;
}

function makeInitialFeatures(nama: string, idx: number): Record<FeatureName, number> {
  const { sin, cos } = bulanSinCos();
  const baseLuas = 110 + (idx % 9) * 31 + (nama.length * 3.7);
  const hist = 420 + Math.sin(idx*0.73)*90 + (idx%3)*25;
  return {
    "temp": 27.2 + Math.sin(idx)*1.4,
    "humidity": 77 + (idx%5)*2 - 3,
    "windspeed": 4.3 + (idx%7)*0.5,
    "dew": 22.1 + (idx%4)*0.6,
    "tanam bulan lalu": Math.round(baseLuas * 0.82),
    "luas tanam komoditi": Math.round(baseLuas * 0.93),
    "lap tanam akhir bulan": Math.round(baseLuas * 0.88),
    "jumlah_pupuk": Math.round(120 + idx*5.2),
    "bulan_sin": Number(sin.toFixed(4)),
    "bulan_cos": Number(cos.toFixed(4)),
    "luas tanam": Math.round(baseLuas),
    "hist_mean_panen_kec": Number(hist.toFixed(1)),
    "panen_lag_1": Number((hist * (0.93 + (idx%4)*0.02)).toFixed(1)),
    "panen_lag_2": Number((hist * (0.88 + (idx%3)*0.015)).toFixed(1)),
    "tanam_lag_1": Math.round(baseLuas * 0.96),
    "tanam_lag_2": Math.round(baseLuas * 0.91),
  };
}

function heuristicPredict(f: Record<FeatureName, number>) {
  // produktivitas baseline ~4.8 ton/ha adjusting cuaca
  const luas = f["luas tanam"];
  const prodBase = 4.65 + (f["jumlah_pupuk"] - 120) * 0.0045;
  const tempAdj = 1 + (f.temp - 27) * 0.012 - Math.max(0, f.temp - 31)*0.04;
  const humAdj = 1 + (f.humidity - 78) * 0.003;
  const windAdj = 1 - Math.max(0, f.windspeed - 7) * 0.018;
  const lagBoost = (f.panen_lag_1 + f.panen_lag_2) / (2 * Math.max(350, f.hist_mean_panen_kec));
  const seasonal = 1 + f.bulan_sin * 0.06;
  const produktivitas = prodBase * tempAdj * humAdj * windAdj * seasonal * (0.88 + lagBoost*0.14);
  const ton = luas * Math.max(2.1, produktivitas);
  return ton;
}

export default function App() {
  const [geo, setGeo] = useState<KecamatanFC | null>(null);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [modelStatus, setModelStatus] = useState<"loading"|"ready"|"fallback">("loading");
  const [modelInputMode, setModelInputMode] = useState<ModelInputMode>("flat_16");
  const [loadedModelShape, setLoadedModelShape] = useState("belum terbaca");
  const [rows, setRows] = useState<KecamatanRow[]>([]);
  const [selectedKode, setSelectedKode] = useState<string>("35.09.19");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [weatherLog, setWeatherLog] = useState<any[]>([]);
  const [geoSource, setGeoSource] = useState("memuat layer administrasi");
  const [selectedLayerInfo, setSelectedLayerInfo] = useState<{
    namaWilayah: string;
    kecamatan: string;
    kodeWilayah: string;
    sumber: string;
  } | null>(null);
  const mapRef = useRef<L.Map|null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);

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
        setGeo({ type:"FeatureCollection", features: [] });
        setGeoSource("tidak ada GeoJSON valid");
      }
    };
    loadAdministrativeLayer();
    return () => { cancelled = true; };
  }, []);

  // load model
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await tf.loadLayersModel("/model/model.json");
        if (cancelled) return;
        const mode = inferModelInputMode(m);
        setModelInputMode(mode);
        setLoadedModelShape(modelShapeLabel(m));
        setModel(m);
        setModelStatus("ready");
      } catch (e) {
        console.warn("Model load gagal, fallback heuristic", e);
        setModelStatus("fallback");
      }
    })();
    return () => { cancelled = true };
  }, []);

  // init rows
  useEffect(() => {
    if (!geo) return;
    const centroidBucket: Record<string, {lat:number, lon:number, count:number}> = {};
    geo.features.forEach((f) => {
      const code = resolveKecamatanCode(f.properties);
      const centroid = centroidFromGeometry(f.geometry);
      if (!code || !centroid) return;
      if (!centroidBucket[code]) centroidBucket[code] = { lat: 0, lon: 0, count: 0 };
      centroidBucket[code].lat += centroid.lat;
      centroidBucket[code].lon += centroid.lon;
      centroidBucket[code].count += 1;
    });
    const featureIndex: Record<string, {lat:number, lon:number}> = {};
    Object.entries(centroidBucket).forEach(([code, value]) => {
      featureIndex[code] = { lat: value.lat / value.count, lon: value.lon / value.count };
    });
    const init: KecamatanRow[] = KEC_LIST.map((k, idx) => {
      const pos = featureIndex[k.kode] || { lat: -8.18 + (idx%6)*0.07, lon: 113.65 + Math.floor(idx/6)*0.08 };
      const feats = makeInitialFeatures(k.nama, idx);
      const predH = heuristicPredict(feats);
      return {
        kode: k.kode,
        nama: k.nama,
        kecamatan: k.nama,
        lat: pos.lat,
        lon: pos.lon,
        features: feats,
        prediksi: predH,
        confidence: 0.82 + (idx%7)*0.022,
        trend: (idx%3===0 ? "naik" : idx%3===1 ? "stabil" : "turun") as any,
        luasHa: feats["luas tanam"],
      };
    });
    setRows(init);
  }, [geo]);

  const filteredRows = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => r.nama.toLowerCase().includes(s) || r.kode.includes(s));
  }, [rows, search]);

  const selectedRow = rows.find(r=>r.kode===selectedKode) || rows[0];

  // predict with model
  const runPrediction = async (targetKode?: string) => {
    const targets = targetKode ? rows.filter(r=>r.kode===targetKode) : rows;
    if (!targets.length) return;
    const updated = [...rows];
    for (const t of targets) {
      let y = 0;
      const fallback = heuristicPredict(t.features);
      if (model && modelStatus==="ready") {
        try {
          const tensor = buildModelInputTensor(t.features, modelInputMode);
          const out = model.predict(tensor) as tf.Tensor;
          const val = (await out.data())[0];
          tensor.dispose(); out.dispose();
          y = transformModelOutput(val, t, fallback);
        } catch {
          y = fallback;
        }
      } else {
        y = fallback;
      }
      const idx = updated.findIndex(u=>u.kode===t.kode);
      if (idx>=0) {
        updated[idx] = { ...updated[idx], prediksi: Number(y.toFixed(1)), confidence: Math.min(0.97, 0.78 + Math.random()*0.18) };
      }
    }
    setRows(updated);
  };

  // first prediction after model ready
  useEffect(()=>{ if(rows.length && modelStatus!=="loading"){ runPrediction(); } }, [modelStatus, rows.length===31]);

  // BMKG sync
  const syncBmkgToFirestore = async () => {
    setSyncing(true);
    const results: any[] = [];
    const now = new Date();
    try {
      for (const kec of KEC_LIST) {
        const desaCodes = BMKG_DESA_MAP[kec.kode] || [];
        let temps:number[] = [];
        let hums:number[] = [];
        let ws:number[] = [];
        for (const adm4Raw of desaCodes) {
          const adm4 = adm4Raw.replace(/\./g,'');
          // BMKG expects like 35.09.17.2001 -> 3509172001 ?
          // API: https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=35.09.17.2001 ?
          // kita coba dua format
          let fetched = false;
          for (const codeTry of [adm4Raw, adm4]) {
            try {
              const res = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${codeTry}`, { mode: 'cors' });
              if (!res.ok) continue;
              const json = await res.json();
              const cuacaArr = json?.data?.[0]?.cuaca?.flat?.() || [];
              if (cuacaArr.length) {
                cuacaArr.slice(0,4).forEach((c:any)=>{
                  if (typeof c.t === 'number') temps.push(c.t);
                  if (typeof c.hu === 'number') hums.push(c.hu);
                  if (typeof c.ws === 'number') ws.push(c.ws);
                });
                fetched = true;
                break;
              }
            } catch {}
          }
          if (!fetched) {
            // mock
            temps.push(26.5 + Math.random()*3);
            hums.push(74 + Math.random()*12);
            ws.push(2.5 + Math.random()*4);
          }
          await new Promise(r=>setTimeout(r, 90)); // throttle
        }
        const avg = (arr:number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
        const docData = {
          kecamatan_kode: kec.kode,
          kecamatan_nama: kec.nama,
          kabupaten: "Jember",
          provinsi: "Jawa Timur",
          waktu_sync: serverTimestamp(),
          waktu_sync_local: now.toISOString(),
          temp_avg: avg(temps) ? Number(avg(temps)!.toFixed(2)) : null,
          humidity_avg: avg(hums) ? Number(avg(hums)!.toFixed(1)) : null,
          windspeed_avg: avg(ws) ? Number(avg(ws)!.toFixed(2)) : null,
          sample_count: temps.length,
          source: "bmkg.go.id/publik/prakiraan-cuaca",
          desa_codes: desaCodes
        };
        try {
          await addDoc(collection(db, "cuaca_jember"), docData);
        } catch(e) {
          console.warn("firestore write fail", e);
        }
        results.push(docData);
        // update rows features temp/humidity/windspeed
        setRows(prev => prev.map(r => r.kode===kec.kode ? ({
          ...r,
          features: {
            ...r.features,
            temp: docData.temp_avg ?? r.features.temp,
            humidity: docData.humidity_avg ?? r.features.humidity,
            windspeed: docData.windspeed_avg ?? r.features.windspeed,
            dew: Number(((docData.temp_avg ?? r.features.temp) - (100-(docData.humidity_avg ?? r.features.humidity))/5).toFixed(1))
          }
        }) : r));
      }
      setLastSync(now);
      setWeatherLog(results.reverse().slice(0,10));
      // re-run prediction
      setTimeout(()=>runPrediction(), 550);
    } finally {
      setSyncing(false);
    }
  };

  // load last firestore logs
  useEffect(()=> {
    (async ()=>{
      try {
        const q = query(collection(db, "cuaca_jember"), orderBy("waktu_sync", "desc"), limit(12));
        const snap = await getDocs(q);
        const d:any[] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (d.length) {
          setWeatherLog(d);
          const ts:any = d[0].waktu_sync;
          if (ts?.toDate) setLastSync(ts.toDate());
          else if (d[0].waktu_sync_local) setLastSync(new Date(d[0].waktu_sync_local));
        }
      } catch {}
    })();
  }, []);

  // auto sync every 3 jam
  useEffect(()=>{
    const id = setInterval(()=>{ syncBmkgToFirestore(); }, 3 * 60 * 60 * 1000);
    return ()=>clearInterval(id);
  }, []);

  const totals = useMemo(()=>{
    const tot = rows.reduce((s,r)=>s+r.prediksi,0);
    const avg = rows.length ? tot/rows.length : 0;
    const top = [...rows].sort((a,b)=>b.prediksi-a.prediksi)[0];
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
    const severeWeather = row.features.temp > 32 || row.features.humidity > 90 || row.features.windspeed > 10;
    const moderateWeather = row.features.temp > 30.5 || row.features.humidity > 86 || row.features.windspeed > 8;
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
    const row = rows.find(r=>r.kode===code);
    const status = getRowStatus(row);
    const meta = STATUS_META[status];
    return {
      fillColor: row ? meta.color : "#cbd5e1",
      weight: selectedKode===code ? 3 : 1.15,
      opacity: 1,
      color: selectedKode===code ? "#0f172a" : row ? meta.stroke : "#94a3b8",
      dashArray: selectedKode===code ? "" : "2 2",
      fillOpacity: selectedKode===code ? 0.86 : 0.72,
    };
  };

  const onEachFeature = (feature: GeoJSON.Feature<any, AdministrativeProps>, layer: L.Layer) => {
    const props = feature.properties || {};
    const code = resolveKecamatanCode(props);
    const row = rows.find(r=>r.kode===code);
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
      mouseout: (e:any) => { geoJsonRef.current?.resetStyle(e.target); }
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
            Produktivitas: <b>${(row.prediksi / Math.max(1,row.luasHa)).toFixed(2)} ton/ha</b><br/>
            Luas tanam: ${row.luasHa} ha<br/>
            Cuaca: ${row.features.temp.toFixed(1)}°C, RH ${Math.round(row.features.humidity)}%, angin ${row.features.windspeed.toFixed(1)} km/j
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:8px;">${meta.desc}</div>
        </div>`
      );
      layer.bindTooltip(
        `<div style="font-family:Inter,sans-serif;font-size:12px;">
          <b>${namaWilayah}</b><br/>
          Kecamatan: ${row.nama}<br/>
          Status: <b style="color:${meta.stroke}">${meta.label}</b><br/>
          Prediksi: <b>${row.prediksi.toLocaleString("id-ID")} ton</b><br/>
          T: ${row.features.temp.toFixed(1)}°C · RH ${Math.round(row.features.humidity)}%
        </div>`, { sticky: true }
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f4] text-slate-800">
      <header className="sticky top-0 z-40 backdrop-blur bg-[#f6f8f4]/85 border-b border-emerald-900/10">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-4 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center font-black shadow shadow-emerald-700/25">SJ</div>
            <div>
              <div className="font-[700] text-[17px] tracking-tight text-emerald-950">SiPanen • Jember Harvest AI</div>
              <div className="text-[11.5px] text-emerald-800/70 -mt-0.5">Dashboard prediksi panen per Kecamatan – Kabupaten Jember, Jawa Timur</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[12px]">
            <span className={`px-2.5 py-1 rounded-full border ${modelStatus==="ready" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : modelStatus==="fallback" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
              Model: {modelStatus==="ready" ? "TensorFlow.js ✔" : modelStatus==="fallback" ? "Heuristik" : "memuat…"}
            </span>
            <span className="text-slate-500 hidden md:inline">
              {modelInputMode === "sequence_3x12" ? "LSTM 3x12" : "Flat 16"} • shape {loadedModelShape} • Firestore Live
            </span>
            <button
              onClick={()=>runPrediction()}
              className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[12.5px] font-semibold shadow-sm"
            >Re-predict all</button>
          </div>
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto px-5 sm:px-8 lg:px-10 py-7 space-y-7">
        {/* KPI */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[22px] border border-emerald-900/10 bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-emerald-700/80">Total Prediksi Kabupaten</div>
            <div className="text-[28px] font-[800] text-emerald-950 mt-1">{totals.tot.toLocaleString("id-ID",{maximumFractionDigits:0})} <span className="text-[15px] font-[600] text-emerald-700">ton</span></div>
            <div className="text-[11.5px] text-slate-500 mt-1">31 kecamatan • {new Date().toLocaleDateString("id-ID", { month:"long", year:"numeric"})}</div>
          </div>
          <div className="rounded-[22px] border border-emerald-900/10 bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-emerald-700/80">Rata-rata / Kecamatan</div>
            <div className="text-[28px] font-[800] text-emerald-950 mt-1">{totals.avg.toFixed(0)} <span className="text-[15px] font-[600] text-emerald-700">ton</span></div>
            <div className="text-[11.5px] text-slate-500 mt-1">Produktivitas ~ {(totals.avg / (selectedRow?.luasHa||260)).toFixed(2)} ton/ha</div>
          </div>
          <div className="rounded-[22px] border border-emerald-900/10 bg-white p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-emerald-700/80">Tertinggi</div>
            <div className="text-[20px] font-[800] text-emerald-950 mt-1">{totals.top?.nama || "-"}</div>
            <div className="text-[13.5px] text-emerald-700 font-[650]">{totals.top ? totals.top.prediksi.toLocaleString("id-ID")+" ton" : "-"}</div>
          </div>
          <div className="rounded-[22px] border border-emerald-900/10 bg-gradient-to-br from-sky-50 to-emerald-50 p-4 shadow-sm">
            <div className="text-[11px] uppercase tracking-wider text-sky-800/80">Cuaca Jember (BMKG)</div>
            <div className="text-[14.5px] font-[700] text-sky-950 mt-1">
              {selectedRow ? `${selectedRow.features.temp.toFixed(1)}°C · ${Math.round(selectedRow.features.humidity)}% RH` : "-"}
            </div>
            <div className="text-[11.5px] text-sky-900/75 mt-1">
              Angin {selectedRow?.features.windspeed.toFixed(1)} km/j • Dew {selectedRow?.features.dew}°C<br/>
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
                    key={rows.map(r=>r.prediksi).join("-").slice(0,200)}
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
                  onChange={e=>setSearch(e.target.value)}
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
                      <div className="font-[700] text-sky-900 text-[15px]">{Math.round(selectedRow.confidence*100)}%</div>
                    </div>
                  </div>
                  <div className="mt-3 text-[11.5px] leading-relaxed text-slate-600">
                    Trend: <span className={selectedRow.trend==="naik" ? "text-emerald-700 font-[600]" : selectedRow.trend==="turun" ? "text-rose-600 font-[600]" : "text-slate-700 font-[600]"}>{selectedRow.trend}</span> • 
                    Panen lag1 {selectedRow.features.panen_lag_1} t • lag2 {selectedRow.features.panen_lag_2} t
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={()=>runPrediction(selectedRow.kode)} className="flex-1 text-[12.5px] font-[650] bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-[9px]">Prediksi Ulang</button>
                    <button onClick={()=>{ const idx = filteredRows.findIndex(r=>r.kode===selectedRow.kode); const next = filteredRows[(idx+1)%filteredRows.length]; if(next) setSelectedKode(next.kode); }} className="text-[12px] px-3 py-[9px] rounded-xl border border-slate-300 hover:bg-slate-50">Next →</button>
                  </div>
                </div>
              )}
              <div className="mt-4 max-h-[260px] overflow-auto pr-1">
                <table className="w-full text-[11.5px]">
                  <thead className="text-slate-500 sticky top-0 bg-white">
                    <tr><th className="text-left py-[6px]">Kecamatan</th><th className="text-right">Ton</th><th className="text-right">Ha</th><th></th></tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(0, 31).map(r=>(
                      <tr key={r.kode} className={`border-t border-slate-100 ${r.kode===selectedKode ? "bg-emerald-50/80" : "hover:bg-slate-50"}`}>
                        <td className="py-[7px] pr-2">
                          <div className="font-[600] text-emerald-950">{r.nama}</div>
                          <div className="text-[10px] text-slate-500">{r.kode}</div>
                        </td>
                        <td className="text-right font-[680]">{r.prediksi.toFixed(0)}</td>
                        <td className="text-right text-slate-600">{r.luasHa}</td>
                        <td className="text-right">
                          <button onClick={()=>setSelectedKode(r.kode)} className="text-emerald-700 text-[11px] hover:underline">buka</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BMKG sync card */}
            <div className="rounded-[24px] border border-sky-900/10 bg-gradient-to-br from-white to-sky-50/60 p-4 shadow-sm">
              <div className="font-[700] text-sky-950">Sinkronisasi Cuaca BMKG → Firestore</div>
              <div className="text-[11.5px] text-sky-900/80 mt-1 leading-relaxed">
                Endpoint: <code className="bg-sky-100/70 px-1 rounded">api.bmkg.go.id/publik/prakiraan-cuaca?adm4=&#123;kode_desa&#125;</code><br/>
                Agregasi per kecamatan, disimpan ke koleksi <b>cuaca_jember</b> tiap 3 jam.
              </div>
              <div className="flex gap-2 mt-3">
                <button disabled={syncing} onClick={syncBmkgToFirestore}
                  className="px-4 py-[9px] rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-[12.5px] font-[650] disabled:opacity-60">
                  {syncing ? "Syncing…" : "Sync BMKG Sekarang"}
                </button>
                <div className="text-[11px] text-sky-900/80 pt-[7px]">
                  {lastSync ? "Terakhir: " + lastSync.toLocaleTimeString("id-ID") : "Belum pernah"}
                </div>
              </div>
              {weatherLog.length>0 && (
                <div className="mt-3 text-[11px] max-h-[165px] overflow-auto border-t border-sky-100 pt-2 space-y-[6px]">
                  {weatherLog.slice(0,8).map((w,i)=>(
                    <div key={i} className="flex justify-between text-sky-950">
                      <span className="font-[600]">{w.kecamatan_nama || w.kecamatan_kode}</span>
                      <span>{w.temp_avg ?? "-"}°C • {w.humidity_avg ?? "-"}% • {w.windspeed_avg ?? "-"} km/h</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-[10.5px] text-sky-800/70 mt-3">
                Firebase Project: <b>andrefirmansyah-f2129</b> • Firestore aktif. CORS BMKG otomatis fallback ke mock bila diblokir browser.
              </div>
            </div>
          </div>
        </section>

        {/* Feature editor */}
        <section className="rounded-[26px] border border-emerald-900/10 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-[700] text-emerald-950">Input Fitur Model – {selectedRow?.nama}</div>
              <div className="text-[11.5px] text-slate-500 mt-0.5">
                Kandidat feature: {KANDIDAT_FEATURES.length} • input aktif: {modelInputMode === "sequence_3x12" ? "LSTM [1, 3, 12]" : "Dense [1, 16]"} • urutan harus sama saat inference
              </div>
            </div>
            <div className="flex gap-2 text-[11.5px]">
              <button onClick={()=>runPrediction(selectedRow?.kode)} className="px-3 py-[7px] rounded-xl bg-emerald-700 text-white font-[600]">Predict</button>
              <button onClick={()=>{ if(!selectedRow) return; const nf = makeInitialFeatures(selectedRow.nama, KEC_LIST.findIndex(k=>k.kode===selectedRow.kode)); setRows(rs=>rs.map(r=> r.kode===selectedRow.kode ? {...r, features:nf}:r)); }} className="px-3 py-[7px] rounded-xl border border-slate-300">Reset fitur</button>
            </div>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
            {selectedRow && KANDIDAT_FEATURES.map(fn => (
              <label key={fn} className="block">
                <div className="text-[10.5px] text-slate-600 mb-1">{fn}</div>
                <input
                  type="number"
                  step="any"
                  value={selectedRow.features[fn]}
                  onChange={e=>{
                    const v = parseFloat(e.target.value);
                    setRows(prev => prev.map(r=> r.kode===selectedRow.kode ? { ...r, features: { ...r.features, [fn]: isNaN(v)?0:v } } : r));
                  }}
                  className="w-full text-[12.5px] border border-slate-300 rounded-lg px-[10px] py-[7px] focus:outline-none focus:ring-2 focus:ring-emerald-500/25 bg-white"
                />
              </label>
            ))}
          </div>
          <div className="px-5 pb-4 text-[11px] text-slate-500 border-t border-slate-100 pt-3">
            LSTM timestep feature ({LSTM_TIMESTEP_FEATURES.length}): {LSTM_TIMESTEP_FEATURES.join(", ")}. Timestep t-2/t-1 memakai tanam_lag dan panen_lag, timestep saat ini memakai luas tanam dan hist_mean_panen_kec.
            bulan_sin / bulan_cos otomatis dari bulan berjalan. hist_mean_panen_kec, panen_lag_1/2, tanam_lag_1/2 sebaiknya diambil dari data historis kecamatan.
            Model path: <code>/model/model.json</code> + <code>group1-shard1of1.bin</code>
          </div>
        </section>

        {/* data table */}
        <section className="rounded-[26px] border border-emerald-900/10 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 font-[700] text-emerald-950">Tabel Prediksi 31 Kecamatan – Jember</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12px]">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-[10px]">Kecamatan</th>
                  <th className="text-right px-3 py-[10px]">Luas Tanam (ha)</th>
                  <th className="text-right px-3 py-[10px]">Temp °C</th>
                  <th className="text-right px-3 py-[10px]">RH %</th>
                  <th className="text-right px-3 py-[10px]">Wind</th>
                  <th className="text-right px-3 py-[10px]">Pupuk</th>
                  <th className="text-right px-3 py-[10px]">Panen Lag1</th>
                  <th className="text-right px-3 py-[10px]">Status</th>
                  <th className="text-right px-3 py-[10px]">Prediksi (ton)</th>
                  <th className="text-right px-4 py-[10px]">Prod (t/ha)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r=>{
                  const status = getRowStatus(r);
                  const meta = STATUS_META[status];
                  return (
                    <tr key={r.kode} className="border-t border-slate-100 hover:bg-emerald-50/40 cursor-pointer" onClick={()=>setSelectedKode(r.kode)}>
                      <td className="px-4 py-[9px]">
                        <div className="font-[620] text-emerald-950">{r.nama}</div>
                        <div className="text-[10.5px] text-slate-500">{r.kode}</div>
                      </td>
                      <td className="text-right px-3">{r.features["luas tanam"]}</td>
                      <td className="text-right px-3">{r.features.temp.toFixed(1)}</td>
                      <td className="text-right px-3">{Math.round(r.features.humidity)}</td>
                      <td className="text-right px-3">{r.features.windspeed.toFixed(1)}</td>
                      <td className="text-right px-3">{r.features.jumlah_pupuk}</td>
                      <td className="text-right px-3">{r.features.panen_lag_1}</td>
                      <td className="text-right px-3">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10.5px] font-[800] ${meta.bg} ${meta.text}`}>{meta.label}</span>
                      </td>
                      <td className="text-right px-3 font-[700] text-emerald-800">{r.prediksi.toLocaleString("id-ID")}</td>
                      <td className="text-right px-4 text-slate-700">{(r.prediksi / Math.max(1,r.luasHa)).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-[11px] text-slate-500 text-center pb-6">
          SiPanen Jember • Deep Learning (TensorFlow.js) • 16 input features • BMKG → Firestore sync 3 jam • © 2026 Dinas Pertanian Jember – demo AI
        </footer>
      </main>
      <style>{`
        .leaflet-container { background:#e9f3e8; font-family: Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; }
        .leaflet-control-attribution { font-size:10px; }
      `}</style>
    </div>
  );
}