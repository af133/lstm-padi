import httpx

from fastapi import APIRouter, HTTPException
from app.services.predict_service import get_prediction
from app.core.config import settings
router = APIRouter()
@router.get("/predict-all-kecamatan")
async def predict_all():
    async with httpx.AsyncClient() as client:
        base_url = settings.PREDICTION_API_URL.rstrip('/')
        url = f"{base_url}/get-features-by-kecamatan"
        response = await client.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Gagal mengambil data")
        all_data = response.json()
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
        for i in range(3, len(flat_data)):
            input_seq = flat_data[i-3 : i]
            pred = get_prediction(input_seq)
            actual = float(flat_data[i]['produksi_ton'])
            
            tahun = str(flat_data[i]['tahun'])
            bulan = str(flat_data[i]['bulan'])
            
            if tahun not in results[kecamatan_id]: results[kecamatan_id][tahun] = {}
            results[kecamatan_id][tahun][bulan] = {"prediksi": round(float(pred), 2), "aktual": actual}
        if len(flat_data) >= 3:
            input_seq = flat_data[-3:] 
            pred = get_prediction(input_seq)
            
            last_item = flat_data[-1]
            last_month = int(last_item['bulan'])
            last_year = int(last_item['tahun'])
            
            next_month = (last_month % 12) + 1
            next_year = last_year + 1 if last_month == 12 else last_year
            str_next_year = str(next_year)
            if str_next_year not in results[kecamatan_id]: results[kecamatan_id][str_next_year] = {}
            
            results[kecamatan_id][str_next_year][str(next_month)] = {
                "prediksi": round(float(pred), 2), 
                "aktual": 0
            }
                
    return results