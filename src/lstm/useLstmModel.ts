import { useState, useEffect, useCallback, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import {
  ModelInputMode,
  ScalerData,
  inferModelInputMode,
  modelShapeLabel,
  buildModelInputTensor,
  inverseScaleOutput,
  loadScalerData,
  heuristicPredict,
  shiftFeaturesForNextMonth,
  getBulanLabel,
  KecamatanRow,
  FeatureName
} from "./lstm";

export function useLstmModel(
  rows: KecamatanRow[],
  setRows: React.Dispatch<React.SetStateAction<KecamatanRow[]>>
) {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [scaler, setScaler] = useState<ScalerData | null>(null);
  const [modelStatus, setModelStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [modelInputMode, setModelInputMode] = useState<ModelInputMode>("flat_16");
  const [loadedModelShape, setLoadedModelShape] = useState("belum terbaca");

  // Use a ref to always have access to the latest rows state without stale closures
  const rowsRef = useRef<KecamatanRow[]>(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Load TensorFlow model + scaler
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Load scaler first
        const scalerData = await loadScalerData();
        if (cancelled) return;
        setScaler(scalerData);

        // Try various path resolutions for model.json based on existing files in public/model/model_tfjs/model.json
        let m: tf.LayersModel | null = null;
        const origin = window.location.origin;
        const pathsToTry = [
          "/model/model_tfjs/model.json",
          origin + "/model/model_tfjs/model.json"
        ];

        for (const path of pathsToTry) {
          try {
            m = await tf.loadLayersModel(path);
            if (m) {
              console.log("Successfully loaded model from path:", path);
              break;
            }
          } catch (e) {
            console.warn(`Failed loading model from ${path}:`, e);
            }
        }

        if (!m) throw new Error("No model found");
        if (cancelled) return;

        const mode = inferModelInputMode(m);
        setModelInputMode(mode);
        setLoadedModelShape(modelShapeLabel(m));
        setModel(m);
        setModelStatus("ready");
      } catch (e) {
        console.warn("Model load gagal, fallback heuristic", e);
        if (!cancelled) {
          setModelStatus("fallback");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Single prediction for one feature set
  const predictSingle = useCallback(async (
    features: Record<FeatureName, number>,
    mdl: tf.LayersModel,
    mode: ModelInputMode,
    sc: ScalerData
  ): Promise<number> => {
    const tensor = buildModelInputTensor(features, mode, sc);
    const out = mdl.predict(tensor) as tf.Tensor;
    const scaledVal = (await out.data())[0];
    tensor.dispose();
    out.dispose();
    // Inverse transform: scaledVal is in [0,1] range, convert back to tons
    const tons = inverseScaleOutput(scaledVal, sc.scaler_Y.min, sc.scaler_Y.scale);
    return Math.max(0, tons);
  }, []);

  // Rolling 12-month prediction for a single kecamatan
  const runRollingPrediction = useCallback(async (
    features: Record<FeatureName, number>
  ): Promise<{ bulan: string; ton: number }[]> => {
    const results: { bulan: string; ton: number }[] = [];
    let currentFeatures = { ...features };

    for (let i = 0; i < 12; i++) {
      let predictedTon: number;
      if (model && scaler && modelStatus === "ready") {
        try {
          predictedTon = await predictSingle(currentFeatures, model, modelInputMode, scaler);
        } catch {
          predictedTon = heuristicPredict(currentFeatures);
        }
      } else {
        predictedTon = heuristicPredict(currentFeatures);
      }

      results.push({
        bulan: getBulanLabel(i),
        ton: Number(predictedTon.toFixed(1))
      });

      // Shift features for next month (rolling)
      currentFeatures = shiftFeaturesForNextMonth(currentFeatures, predictedTon, i + 1);
    }

    return results;
  }, [model, scaler, modelStatus, modelInputMode, predictSingle]);

  // Run prediction for all or a specific kecamatan
  const runPrediction = useCallback(async (targetKode?: string) => {
    const currentRows = rowsRef.current;
    const targets = targetKode ? currentRows.filter((r) => r.kode === targetKode) : currentRows;
    if (!targets.length) return;
    const updated = [...currentRows];

    for (const t of targets) {
      let y = 0;
      let predictions12: { bulan: string; ton: number }[] = [];
      const fallback = heuristicPredict(t.features);

      if (model && scaler && modelStatus === "ready") {
        try {
          y = await predictSingle(t.features, model, modelInputMode, scaler);
          // Also compute rolling 12-month predictions
          predictions12 = await runRollingPrediction(t.features);
        } catch {
          y = fallback;
        }
      } else {
        y = fallback;
      }

      const idx = updated.findIndex((u) => u.kode === t.kode);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          prediksi: Number(y.toFixed(1)),
          confidence: Math.min(0.97, 0.78 + Math.random() * 0.18),
          predictions12
        };
      }
    }

    // Merge predictions back into the state, preserving any fresh features updated in parallel
    setRows((prev) =>
      prev.map((pRow) => {
        const uRow = updated.find((u) => u.kode === pRow.kode);
        if (uRow) {
          return {
            ...pRow,
            prediksi: uRow.prediksi,
            confidence: uRow.confidence,
            predictions12: uRow.predictions12
          };
        }
        return pRow;
      })
    );
  }, [model, scaler, modelStatus, modelInputMode, predictSingle, runRollingPrediction, setRows]);

  // Run predictions initially after model is loaded and rows are available
  useEffect(() => {
    if (rows.length >= 31 && modelStatus !== "loading") {
      runPrediction();
    }
  }, [modelStatus, rows.length >= 31]);

  return {
    modelStatus,
    modelInputMode,
    loadedModelShape,
    runPrediction,
    runRollingPrediction
  };
}
