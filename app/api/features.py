from fastapi import APIRouter, HTTPException
import numpy as np
from collections import defaultdict
from app.schemas.input_data import KecamatanData
from app.services.supabase_service import (
    save_kecamatan_features,
    update_kecamatan_features,
    delete_kecamatan_features,
    get_all_kecamatan_features,
    get_cuaca_jember
)
router = APIRouter()
@router.post("/save-features")
async def save_data(data: KecamatanData):
    try:
        data_dict = data.model_dump() if hasattr(data, "model_dump") else data.dict()
        success = save_kecamatan_features(data_dict)
        if success:
            return {"status": "success", "message": "Data berhasil disimpan ke Supabase"}
        else:
            return {"status": "error", "message": "Gagal menyimpan data ke Supabase"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
@router.patch("/update-features/{doc_id}")
async def update_data(doc_id: str, data: KecamatanData):
    try:
        data_dict = data.model_dump() if hasattr(data, "model_dump") else data.dict()
        success = update_kecamatan_features(doc_id, data_dict)
        if success:
            return {"status": "success", "message": f"Dokumen {doc_id} berhasil diupdate"}
        return {"status": "error", "message": "Gagal mengupdate dokumen"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
@router.delete("/delete-features/{doc_id}")
async def delete_data(doc_id: str):
    try:
        success = delete_kecamatan_features(doc_id)
        if success:
            return {"status": "success", "message": f"Dokumen {doc_id} berhasil dihapus"}
        return {"status": "error", "message": "Gagal menghapus dokumen"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


def encode_bulan(bulan):
    sin_bulan = np.sin(2 * np.pi * bulan / 12)
    cos_bulan = np.cos(2 * np.pi * bulan / 12)
    return sin_bulan, cos_bulan
 
 
@router.get("/get-features-structured")
async def get_monthly_features_structured():
    try:
        raw_docs = get_all_kecamatan_features()
        if not raw_docs:
            return {}
        grouped_data = defaultdict(
            lambda: defaultdict(
                lambda: defaultdict(
                    lambda: defaultdict(list)
                )
            )
        )
        for doc in raw_docs:
            if not isinstance(doc, dict):
                continue
            tahun = str(doc.get("tahun", "0"))
            bulan_raw = doc.get("bulan", 0)
            bulan = str(bulan_raw)
            tanggal = str(doc.get("tanggal", "0"))
            kode = str(doc.get("kode", "unknown"))
            features = doc.get("features", {})
            if not isinstance(features, dict):
                features = {}
            try:
                bulan_int = int(bulan_raw)
            except (TypeError, ValueError):
                bulan_int = 0
            bulan_sin, bulan_cos = encode_bulan(bulan_int)
            filtered_features = {k: features.get(k, 0.0) for k in [
                'produksi_ton_gkg', 'panen_bersih_admin_ha', 'tanam_total_ha',
                'curah_hujan_mm', 'temp_avg_c', 'humidity_pct_clean',
                'wind_speed_kmh', 'urea_kg', 'npk_kg'
            ]}
            filtered_features['bulan_sin'] = float(bulan_sin)
            filtered_features['bulan_cos'] = float(bulan_cos)
            grouped_data[kode][tahun][bulan][tanggal].append(filtered_features)
        return dict(grouped_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/get-cuaca-jember")
async def get_cuaca_endpoint():
    data = get_cuaca_jember()
    return {"status": "success", "data": data}

@router.get("/get-all-kecamatan")
async def get_data_all_kecamatan():
    try:
        raw_docs = get_all_kecamatan_features()
        if isinstance(raw_docs, dict):
            raw_docs = raw_docs.get("data", list(raw_docs.values()) if not any(isinstance(v, list) for v in raw_docs.values()) else [])
        if not isinstance(raw_docs, list):
            raw_docs = [raw_docs] if raw_docs else []
        formatted_docs = []
        for doc in raw_docs:
            if not isinstance(doc, dict):
                continue
            formatted_doc = {
                "id": str(doc.get("id", "")),
                "kode": doc.get("kode", ""),
                "tahun": int(doc.get("tahun", 0)),
                "bulan": int(doc.get("bulan", 0)),
                "tanggal": doc.get("tanggal"), 
                "created_at": doc.get("created_at"),
                "updated_at": doc.get("updated_at"),
                "features": doc.get("features", {})
            }
            formatted_docs.append(formatted_doc)
        return formatted_docs
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))