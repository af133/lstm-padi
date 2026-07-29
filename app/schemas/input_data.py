from pydantic import BaseModel
from typing import Dict, Any

class KecamatanData(BaseModel):
    bulan: int
    tahun: int
    kode: str
    features: Dict[str, Any]