from fastapi import APIRouter, HTTPException
from app.schemas.input_data import KecamatanData
from app.services.supabase_service import (
    save_kecamatan_features,
    update_kecamatan_features,
    delete_kecamatan_features,
    get_all_kecamatan_features,
    get_cuaca_jember
)
from collections import defaultdict
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

@router.get("/get-features-by-kecamatan")
async def get_data_by_kecamatan():
    docs = get_all_kecamatan_features()
    grouped_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for doc in docs:
        tahun = str(doc.get("tahun", "0"))
        bulan = str(doc.get("bulan", "0"))
        kode = str(doc.get("kode", "unknown"))
        features = doc.get("features", {})
        
        grouped_data[kode][tahun][bulan].append(features)
        
    return grouped_data
@router.get("/get-cuaca-jember")
async def get_cuaca_endpoint():
    data = get_cuaca_jember()
    return {"status": "success", "data": data}
@router.get("/get-all-kecamatan")
async def get_data_all_kecamatan():
    try:
        raw_docs = get_all_kecamatan_features()
        formatted_docs = []
        for doc in raw_docs:
            formatted_doc = {
                "id": str(doc.get("id")),
                "kode": doc.get("kode"),
                "tahun": int(doc.get("tahun", 0)),
                "bulan": int(doc.get("bulan", 0)),
                "created_at": doc.get("created_at"),
                "updated_at": doc.get("updated_at"),
                "features": doc.get("features", {})
            }
            formatted_docs.append(formatted_doc)
        return formatted_docs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))