from fastapi import APIRouter
from app.schemas.input_data import KecamatanData
from app.services.firebase_service import save_kecamatan_features,update_kecamatan_features,delete_kecamatan_features, get_all_kecamatan_features
from collections import defaultdict
router = APIRouter()

@router.post("/save-features")
async def save_data(data: KecamatanData):
    try:
        success = save_kecamatan_features(data.dict())
        if success:
            return {"status": "success", "message": "Data berhasil disimpan"}
        else:
            return {"status": "error", "message": "Gagal menyimpan ke Firestore (Status Code error)"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.patch("/update-features/{doc_id}")
async def update_data(
    doc_id: str, 
    data: KecamatanData
):
    success = update_kecamatan_features(doc_id, data.dict())
    if success:
        return {"status": "success", "message": f"Dokumen {doc_id} berhasil diupdate"}
    return {"status": "error", "message": "Gagal mengupdate dokumen"}

@router.delete("/delete-features/{doc_id}")
async def delete_data(doc_id: str):
    success = delete_kecamatan_features(doc_id)
    if success:
        return {"status": "success", "message": f"Dokumen {doc_id} berhasil dihapus"}
    return {"status": "error", "message": "Gagal menghapus dokumen"}

@router.get("/get-features-by-kecamatan")
async def get_data_by_kecamatan():
    docs = get_all_kecamatan_features()
    grouped_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for doc in docs:
        fields = doc.get("fields", {})
        tahun = fields.get("tahun", {}).get("integerValue", "0")
        bulan = fields.get("bulan", {}).get("integerValue", "0")
        kode = fields.get("kode", {}).get("stringValue", "unknown")
        raw_features = fields.get("features", {}).get("mapValue", {}).get("fields", {})
        clean_features = {}
        for key, val in raw_features.items():
            value = list(val.values())[0]
            clean_features[key] = value
        grouped_data[kode][tahun][bulan].append(clean_features)
    return grouped_data