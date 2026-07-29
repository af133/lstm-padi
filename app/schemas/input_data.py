from pydantic import BaseModel
from typing import Dict, Any
from datetime import date

class KecamatanData(BaseModel):
    bulan: int
    tahun: int
    kode: str
    tanggal:date
    features: Dict[str, Any]