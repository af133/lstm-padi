from fastapi import APIRouter
from app.schemas.input_data import KecamatanData
from app.services.firebase_service import save_kecamatan_features,update_kecamatan_features,delete_kecamatan_features

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