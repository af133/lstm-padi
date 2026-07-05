import * as tf from "@tensorflow/tfjs";

// ─── Feature definitions (must match training Python code EXACTLY) ───
// Order: luas tanam, luas panen bersih, curah_hujan_mm, suhu_rata2_c, kelembaban_persen,
//        luas_tanam_lag3, luas_tanam_lag4, curah_hujan_lag1, curah_hujan_lag2,
//        jumlah_pupuk, bulan_sin, bulan_cos, panen_lag_1, panen_lag_2, tanam_lag_1, tanam_lag_2

export const KANDIDAT_FEATURES = [
  "luas tanam",
  "luas panen bersih",
  "curah_hujan_mm",
  "suhu_rata2_c",
  "kelembaban_persen",
  "luas_tanam_lag3",
  "luas_tanam_lag4",
  "curah_hujan_lag1",
  "curah_hujan_lag2",
  "jumlah_pupuk",
  "bulan_sin",
  "bulan_cos",
  "panen_lag_1",
  "panen_lag_2",
  "tanam_lag_1",
  "tanam_lag_2"
] as const;

export type FeatureName = typeof KANDIDAT_FEATURES[number];

export type ModelInputMode = "sequence_3x16" | "flat_16";

// Friendly labels for UI display
export const FEATURE_LABELS: Record<FeatureName, string> = {
  "luas tanam": "Luas Tanam (ha)",
  "luas panen bersih": "Luas Panen Bersih (ha)",
  "curah_hujan_mm": "Curah Hujan (mm)",
  "suhu_rata2_c": "Suhu Rata² (°C)",
  "kelembaban_persen": "Kelembaban (%)",
  "luas_tanam_lag3": "Tanam Lag-3 (ha)",
  "luas_tanam_lag4": "Tanam Lag-4 (ha)",
  "curah_hujan_lag1": "Curah Hujan Lag-1",
  "curah_hujan_lag2": "Curah Hujan Lag-2",
  "jumlah_pupuk": "Jumlah Pupuk (kg)",
  "bulan_sin": "Bulan Sin",
  "bulan_cos": "Bulan Cos",
  "panen_lag_1": "Panen Lag-1 (ton)",
  "panen_lag_2": "Panen Lag-2 (ton)",
  "tanam_lag_1": "Tanam Lag-1 (ha)",
  "tanam_lag_2": "Tanam Lag-2 (ha)"
};

export type KecamatanRow = {
  kode: string;
  nama: string;
  kecamatan: string;
  lat: number;
  lon: number;
  features: Record<FeatureName, number>;
  prediksi: number;
  confidence: number;
  trend: "naik" | "stabil" | "turun";
  timestamp?: number;
  luasHa?: number;
  luasHa: number;
  /** Rolling 12-month predictions for chart */
  predictions12?: { bulan: string; ton: number }[];
};

// ─── Scaler types ───
export type ScalerData = {
  scaler_X: { min: number[]; scale: number[] };
  scaler_Y: { min: number[]; scale: number[] };
};

let _cachedScaler: ScalerData | null = null;

export async function loadScalerData(): Promise<ScalerData> {
  if (_cachedScaler) return _cachedScaler;
  const resp = await fetch("/model/scaler_data.json");
  const data = await resp.json();
  _cachedScaler = data;
  return data;
}

/** Apply MinMaxScaler: scaled = (x - min) * scale */
export function applyMinMaxScaler(values: number[], min: number[], scale: number[]): number[] {
  return values.map((v, i) => (v - (min[i] ?? 0)) * (scale[i] ?? 1));
}

/** Inverse MinMaxScaler: original = scaled / scale + min */
export function inverseScaleOutput(scaled: number, min: number[], scale: number[]): number {
  if (!scale[0] || scale[0] === 0) return scaled;
  return scaled / scale[0] + min[0];
}

// ─── Helper: bulan sin/cos ───
export function bulanSinCos(date = new Date()) {
  const m = date.getMonth() + 1;
  const angle = (2 * Math.PI * m) / 12;
  return { sin: Math.sin(angle), cos: Math.cos(angle) };
}

export function shiftedBulanSinCos(offset: number) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return bulanSinCos(d);
}

// ─── Model shape detection ───
export function inferModelInputMode(model: tf.LayersModel): ModelInputMode {
  const shape = (model.inputs?.[0] as any)?.shape || (model as any).inputShape;
  if (Array.isArray(shape) && shape.length === 3 && shape[1] === 3 && shape[2] === 16) return "sequence_3x16";
  return "flat_16";
}

export function modelShapeLabel(model: tf.LayersModel) {
  const shape = (model.inputs?.[0] as any)?.shape || (model as any).inputShape;
  return Array.isArray(shape) ? `[${shape.map((v: any) => v ?? "null").join(", ")}]` : "unknown";
}

// ─── Build LSTM 3-timestep sequence (3×16) ───
// Each timestep is the full 16-feature vector
// t-2: uses lag3/lag4 data, bulan offset -2
// t-1: uses lag1/lag2 data, bulan offset -1
// t-0: current month data
export function buildLstmSequence(f: Record<FeatureName, number>): number[][] {
  const m2 = shiftedBulanSinCos(-2);
  const m1 = shiftedBulanSinCos(-1);

  // Timestep t-2: shift lags backward
  const t2 = [
    f.tanam_lag_2,          // luas tanam → use tanam_lag_2 as proxy
    f["luas panen bersih"], // luas panen bersih (use current as approx)
    f.curah_hujan_lag2,     // curah_hujan_mm → use lag2
    f.suhu_rata2_c,         // suhu (approx same)
    f.kelembaban_persen,    // kelembaban (approx same)
    f.luas_tanam_lag4,      // luas_tanam_lag3 → use lag4 as proxy
    0,                      // luas_tanam_lag4 → unknown further back, 0
    0,                      // curah_hujan_lag1 → unknown further back, 0
    f.curah_hujan_lag2,     // curah_hujan_lag2 → approx same
    f.jumlah_pupuk,         // jumlah_pupuk (approx same)
    Number(m2.sin.toFixed(4)),
    Number(m2.cos.toFixed(4)),
    f.panen_lag_2,          // panen_lag_1 → use panen_lag_2
    0,                      // panen_lag_2 → unknown further back
    f.tanam_lag_2,          // tanam_lag_1 → use tanam_lag_2
    0                       // tanam_lag_2 → unknown
  ];

  // Timestep t-1: shift lags backward by 1
  const t1 = [
    f.tanam_lag_1,          // luas tanam → use tanam_lag_1
    f["luas panen bersih"], // approx same
    f.curah_hujan_lag1,     // curah_hujan_mm → use lag1
    f.suhu_rata2_c,
    f.kelembaban_persen,
    f.luas_tanam_lag3,      // luas_tanam_lag3 → correct
    f.luas_tanam_lag4,      // luas_tanam_lag4 → correct
    f.curah_hujan_lag2,     // curah_hujan_lag1 → use lag2 shifted
    0,                      // curah_hujan_lag2 → unknown
    f.jumlah_pupuk,
    Number(m1.sin.toFixed(4)),
    Number(m1.cos.toFixed(4)),
    f.panen_lag_1,          // panen_lag_1 → use current panen_lag_1
    f.panen_lag_2,          // panen_lag_2 → correct
    f.tanam_lag_1,          // tanam_lag_1 → correct
    f.tanam_lag_2           // tanam_lag_2 → correct
  ];

  // Timestep t-0: current month
  const t0 = [
    f["luas tanam"],
    f["luas panen bersih"],
    f.curah_hujan_mm,
    f.suhu_rata2_c,
    f.kelembaban_persen,
    f.luas_tanam_lag3,
    f.luas_tanam_lag4,
    f.curah_hujan_lag1,
    f.curah_hujan_lag2,
    f.jumlah_pupuk,
    f.bulan_sin,
    f.bulan_cos,
    f.panen_lag_1,
    f.panen_lag_2,
    f.tanam_lag_1,
    f.tanam_lag_2
  ];

  return [t2, t1, t0];
}

/** Build tensor for model input — applies MinMaxScaler normalization */
export function buildModelInputTensor(
  f: Record<FeatureName, number>,
  mode: ModelInputMode,
  scaler: ScalerData
): tf.Tensor {
  if (mode === "sequence_3x16") {
    const seq = buildLstmSequence(f);
    // Apply scaler to each timestep
    const scaledSeq = seq.map(row => applyMinMaxScaler(row, scaler.scaler_X.min, scaler.scaler_X.scale));
    return tf.tensor3d([scaledSeq], [1, 3, 16]);
  }
  // Flat mode fallback
  const flat = KANDIDAT_FEATURES.map(k => f[k] ?? 0);
  const scaledFlat = applyMinMaxScaler(flat, scaler.scaler_X.min, scaler.scaler_X.scale);
  return tf.tensor2d([scaledFlat], [1, KANDIDAT_FEATURES.length]);
}

// ─── Default initial features ───
export function makeInitialFeatures(nama: string, idx: number): Record<FeatureName, number> {
  const { sin, cos } = bulanSinCos();
  const baseLuas = 110 + (idx % 9) * 31 + (nama.length * 3.7);
  const hist = 420 + Math.sin(idx * 0.73) * 90 + (idx % 3) * 25;
  return {
    "luas tanam": Math.round(baseLuas),
    "luas panen bersih": Math.round(baseLuas * 0.88),
    "curah_hujan_mm": Number((3.5 + Math.sin(idx * 0.5) * 2.5).toFixed(2)),
    "suhu_rata2_c": Number((27.2 + Math.sin(idx) * 1.4).toFixed(1)),
    "kelembaban_persen": Number((77 + (idx % 5) * 2 - 3).toFixed(0)),
    "luas_tanam_lag3": Math.round(baseLuas * 0.91),
    "luas_tanam_lag4": Math.round(baseLuas * 0.87),
    "curah_hujan_lag1": Number((4.0 + Math.sin(idx * 0.3) * 2.0).toFixed(2)),
    "curah_hujan_lag2": Number((3.8 + Math.cos(idx * 0.4) * 1.8).toFixed(2)),
    "jumlah_pupuk": Math.round(120000 + idx * 15200),
    "bulan_sin": Number(sin.toFixed(4)),
    "bulan_cos": Number(cos.toFixed(4)),
    "panen_lag_1": Number((hist * (0.93 + (idx % 4) * 0.02)).toFixed(1)),
    "panen_lag_2": Number((hist * (0.88 + (idx % 3) * 0.015)).toFixed(1)),
    "tanam_lag_1": Math.round(baseLuas * 0.96),
    "tanam_lag_2": Math.round(baseLuas * 0.91),
  };
}

// ─── Heuristic predictor (fallback if model not loaded) ───
export function heuristicPredict(f: Record<FeatureName, number>) {
  const luas = f["luas tanam"];
  const pupukNorm = Math.min(f.jumlah_pupuk / 300000, 2);
  const prodBase = 4.65 + pupukNorm * 0.8;
  const tempAdj = 1 + (f.suhu_rata2_c - 27) * 0.012 - Math.max(0, f.suhu_rata2_c - 31) * 0.04;
  const humAdj = 1 + (f.kelembaban_persen - 78) * 0.003;
  const rainAdj = 1 + Math.min(f.curah_hujan_mm, 12) * 0.01 - Math.max(0, f.curah_hujan_mm - 15) * 0.02;
  const lagBoost = f.panen_lag_1 > 0 ? (f.panen_lag_1 + f.panen_lag_2) / (2 * Math.max(350, f.panen_lag_1)) : 1;
  const seasonal = 1 + f.bulan_sin * 0.06;
  const produktivitas = prodBase * tempAdj * humAdj * rainAdj * seasonal * (0.88 + lagBoost * 0.14);
  const ton = luas * Math.max(2.1, produktivitas);
  return ton;
}

// ─── Bulan name helper ───
const BULAN_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des"
];

export function getBulanLabel(monthOffset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset);
  const m = d.getMonth();
  const y = d.getFullYear();
  return `${BULAN_NAMES[m]} ${y}`;
}

/** Build features for a future month given current features + predicted production */
export function shiftFeaturesForNextMonth(
  current: Record<FeatureName, number>,
  predictedTon: number,
  monthOffset: number
): Record<FeatureName, number> {
  const sc = shiftedBulanSinCos(monthOffset);
  return {
    ...current,
    // Shift lags
    "panen_lag_2": current.panen_lag_1,
    "panen_lag_1": predictedTon,
    "tanam_lag_2": current.tanam_lag_1,
    "tanam_lag_1": current["luas tanam"],
    "luas_tanam_lag4": current.luas_tanam_lag3,
    "luas_tanam_lag3": current["luas tanam"],
    "curah_hujan_lag2": current.curah_hujan_lag1,
    "curah_hujan_lag1": current.curah_hujan_mm,
    // Update sin/cos for the new month
    "bulan_sin": Number(sc.sin.toFixed(4)),
    "bulan_cos": Number(sc.cos.toFixed(4)),
  };
}
