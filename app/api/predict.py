import httpx
import numpy as np
from fastapi import APIRouter, HTTPException
from app.services.predict_service import extract_features, predict_batch
from app.core.config import settings
from app.services.supabase_service import get_cuaca_jember

router = APIRouter()

def get_status_produktivitas(pred: float, mean: float, std: float) -> str:
    if std == 0:
        return "Aman"
    z = (pred - mean) / std
    if z < -1.5:
        return "Rawan"
    if -1.5 <= z < -0.5:
        return "Waspada"
    return "Aman"

def get_status_kelembapan(hum: float) -> str:
    if hum > 85: return "Rawan"
    if 80 < hum <= 85: return "Waspada"
    if 60 <= hum <= 80: return "Aman"
    return "Waspada"

def get_status_suhu(temp: float) -> str:
    if temp >= 35: return "Rawan"
    if 33 <= temp < 35: return "Waspada"
    return "Aman"

@router.get("/predict-all-kecamatan")
async def predict_all():
    async with httpx.AsyncClient() as client:
        base_url = settings.PREDICTION_API_URL.rstrip('/')
        try:
            response = await client.get(f"{base_url}/get-features-by-kecamatan")
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Gagal mengambil data dari internal service")
            all_data = response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"HTTP Request Error: {str(e)}")

    cuaca_map = get_cuaca_jember()
    
    batch_inputs = []
    tasks_meta = []
    results = {}
    for kecamatan_id, data_tahun in all_data.items():
        results[kecamatan_id] = {}
        flat_data = []
        for tahun in sorted(data_tahun.keys(), key=int):
            for bulan in sorted(data_tahun[tahun].keys(), key=int):
                items = data_tahun[tahun][bulan]
                if items and isinstance(items, list):
                    item = items[-1].copy()
                    item['bulan'] = int(bulan)
                    item['tahun'] = int(tahun)
                    flat_data.append(item)
        
        if not flat_data:
            continue

        prod_values = [float(item.get('produksi_ton', 0.0)) for item in flat_data]
        mean_p = float(np.mean(prod_values)) if prod_values else 0.0
        std_p = float(np.std(prod_values)) if prod_values else 0.0
        for i in range(3, len(flat_data)):
            input_seq = flat_data[i-3 : i]
            scaled_matrix = extract_features(input_seq)
            batch_inputs.append(scaled_matrix)
            tasks_meta.append({
                "type": "history",
                "kecamatan_id": kecamatan_id,
                "tahun": str(flat_data[i]['tahun']),
                "bulan": str(flat_data[i]['bulan']),
                "aktual": float(flat_data[i].get('produksi_ton', 0.0))
            })
        if len(flat_data) >= 3:
            input_seq = flat_data[-3:]
            scaled_matrix = extract_features(input_seq)
            batch_inputs.append(scaled_matrix)
            
            last_item = flat_data[-1]
            last_m = int(last_item['bulan'])
            last_y = int(last_item['tahun'])
            next_m = (last_m % 12) + 1
            next_y = last_y + (1 if last_m == 12 else 0)

            tasks_meta.append({
                "type": "future",
                "kecamatan_id": kecamatan_id,
                "tahun": str(next_y),
                "bulan": str(next_m),
                "mean_p": mean_p,
                "std_p": std_p
            })
    predictions = predict_batch(batch_inputs)
    for meta, pred_val in zip(tasks_meta, predictions):
        kec_id = meta["kecamatan_id"]
        y_str = meta["tahun"]
        m_str = meta["bulan"]

        if y_str not in results[kec_id]:
            results[kec_id][y_str] = {}

        if meta["type"] == "history":
            results[kec_id][y_str][m_str] = {
                "prediksi": round(float(pred_val), 2),
                "aktual": meta["aktual"]
            }
        elif meta["type"] == "future":
            cuaca = cuaca_map.get(kec_id, {"temp_avg": 25.0, "humidity_avg": 70.0})
            mean_p = meta["mean_p"]
            std_p = meta["std_p"]

            s_prod = get_status_produktivitas(pred_val, mean_p, std_p)
            s_suhu = get_status_suhu(cuaca.get('temp_avg', 25.0))
            s_hum = get_status_kelembapan(cuaca.get('humidity_avg', 70.0))
            z_score = round((pred_val - mean_p) / std_p, 2) if std_p != 0 else 0.0

            if s_prod == "Rawan":
                status = "Rawan"
            elif s_prod == "Waspada" and (s_suhu == "Rawan" or s_hum == "Rawan"):
                status = "Rawan"
            elif s_prod == "Waspada":
                status = "Waspada"
            elif s_prod == "Aman" and s_suhu == "Aman" and s_hum == "Aman":
                status = "Aman"
            else:
                status = "Waspada"

            results[kec_id][y_str][m_str] = {
                "prediksi": round(float(pred_val), 2),
                "aktual": 0,
                "status_produktivitas": s_prod,
                "status_suhu": s_suhu,
                "status_kelembapan": s_hum,
                "z_score": z_score,
                "status": status
            }

    return results