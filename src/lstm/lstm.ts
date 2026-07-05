import * as tf from "@tensorflow/tfjs";

const env: any = (import.meta as any).env || {};

export type ModelInputMode = "sequence_3x12" | "flat_16";

export const KANDIDAT_FEATURES = [
  "temp", "humidity", "windspeed", "dew",
  "tanam bulan lalu", "luas tanam komoditi",
  "lap tanam akhir bulan",
  "jumlah_pupuk",
  "bulan_sin", "bulan_cos",
  "luas tanam", "hist_mean_panen_kec",
  "panen_lag_1", "panen_lag_2",
  "tanam_lag_1", "tanam_lag_2"
] as const;

export type FeatureName = typeof KANDIDAT_FEATURES[number];

export const LSTM_TIMESTEP_FEATURES = [
  "temp", "humidity", "windspeed", "dew",
  "tanam", "luas_tanam_komoditi", "lap_tanam",
  "jumlah_pupuk", "bulan_sin", "bulan_cos",
  "luas_tanam", "panen_ref"
] as const;

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
  luasHa: number;
};

const modelOutputMode = String(env.VITE_MODEL_OUTPUT_MODE).toLowerCase();
const modelOutputMultiplier = Number(env.VITE_MODEL_OUTPUT_MULTIPLIER);
const modelOutputOffset = Number(env.VITE_MODEL_OUTPUT_OFFSET);

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

export function inferModelInputMode(model: tf.LayersModel): ModelInputMode {
  const shape = (model.inputs?.[0] as any)?.shape || (model as any).inputShape;
  if (Array.isArray(shape) && shape.length === 3 && shape[1] === 3 && shape[2] === 12) return "sequence_3x12";
  return "flat_16";
}

export function modelShapeLabel(model: tf.LayersModel) {
  const shape = (model.inputs?.[0] as any)?.shape || (model as any).inputShape;
  return Array.isArray(shape) ? `[${shape.map((v) => v ?? "null").join(", ")}]` : "unknown";
}

export function buildLstmSequence(f: Record<FeatureName, number>) {
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

export function buildModelInputTensor(f: Record<FeatureName, number>, mode: ModelInputMode) {
  if (mode === "sequence_3x12") return tf.tensor3d([buildLstmSequence(f)], [1, 3, 12]);
  return tf.tensor2d([KANDIDAT_FEATURES.map((k) => f[k] ?? 0)], [1, KANDIDAT_FEATURES.length]);
}

export function transformModelOutput(raw: number, row: { luasHa: number }, fallbackTon: number) {
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

export function makeInitialFeatures(nama: string, idx: number): Record<FeatureName, number> {
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

export function heuristicPredict(f: Record<FeatureName, number>) {
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
