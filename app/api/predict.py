import httpx
import numpy as np
from fastapi import APIRouter, HTTPException
from app.services.predict_service import get_prediction
from app.core.config import settings
from app.services.firebase_service import get_cuaca_jember

router = APIRouter()
def get_status_produktivitas(pred, mean, std):
    if std == 0: return "Aman"
    z = (pred - mean) / std
    if z < -1.5: return "Rawan"
    if -1.5 <= z < -0.5: return "Waspada"
    return "Aman"
def get_status_kelembapan(hum):
    if hum > 85: return "Rawan"
    if 80 < hum <= 85: return "Waspada"
    if 60 <= hum <= 80: return "Aman"
    return "Waspada"

def get_status_suhu(temp):
    if temp >= 35: return "Rawan"
    if 33 <= temp < 35: return "Waspada"
    return "Aman"

@router.get("/predict-all-kecamatan")
async def predict_all():
    async with httpx.AsyncClient() as client:
        base_url = settings.PREDICTION_API_URL.rstrip('/')
        response = await client.get(f"{base_url}/get-features-by-kecamatan")
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Gagal mengambil data")
        all_data = response.json()
    
    cuaca_map = get_cuaca_jember() 
    results = {}

    for kecamatan_id, data_tahun in all_data.items():
        results[kecamatan_id] = {}
        flat_data = []
        for tahun in sorted(data_tahun.keys()):
            for bulan in sorted(data_tahun[tahun].keys(), key=int):
                item = data_tahun[tahun][bulan][0]
                item['bulan'] = bulan
                item['tahun'] = tahun
                flat_data.append(item)
        prod_values = [float(item['produksi_ton']) for item in flat_data]
        mean_p, std_p = (np.mean(prod_values), np.std(prod_values)) if prod_values else (0, 0)
        for i in range(3, len(flat_data)):
            input_seq = flat_data[i-3 : i]
            pred = get_prediction(input_seq)
            actual = float(flat_data[i]['produksi_ton'])
            y_str, m_str = str(flat_data[i]['tahun']), str(flat_data[i]['bulan'])
            if y_str not in results[kecamatan_id]: results[kecamatan_id][y_str] = {}
            results[kecamatan_id][y_str][m_str] = {"prediksi": round(float(pred), 2), "aktual": actual}
        if len(flat_data) >= 3:
            input_seq = flat_data[-3:]
            pred = float(get_prediction(input_seq))
            cuaca = cuaca_map.get(kecamatan_id, {"temp_avg": 25.0, "humidity_avg": 70.0})
            s_prod = get_status_produktivitas(pred, mean_p, std_p)
            s_suhu = get_status_suhu(cuaca['temp_avg'])
            s_hum = get_status_kelembapan(cuaca['humidity_avg'])
            z_score = round((pred - mean_p) / std_p, 2) if std_p != 0 else 0
            if s_prod == "Rawan": status = "Rawan"
            elif s_prod == "Waspada" and (s_suhu == "Rawan" or s_hum == "Rawan"): status = "Rawan"
            elif s_prod == "Waspada": status = "Waspada"
            elif s_prod == "Aman" and s_suhu == "Aman" and s_hum == "Aman": status = "Aman"
            else: status = "Waspada"
            last_item = flat_data[-1]
            m, y = (int(last_item['bulan']) % 12) + 1, int(last_item['tahun']) + (1 if int(last_item['bulan']) == 12 else 0)
            if str(y) not in results[kecamatan_id]: results[kecamatan_id][str(y)] = {}
            results[kecamatan_id][str(y)][str(m)] = {
                "prediksi": round(pred, 2),
                "aktual": 0,
                "status_produktivitas": s_prod,
                "status_suhu": s_suhu,
                "status_kelembapan": s_hum,
                "z_score": z_score,
                "status": status
            }
                
    return results