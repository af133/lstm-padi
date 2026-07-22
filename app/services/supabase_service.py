import os
import time
import random
from datetime import datetime
import requests
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from supabase import create_client, Client

from app.core.config import settings
from app.core.master_data import DESA_MAPPING
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
def save_kecamatan_features(data: dict) -> bool:
    try:
        payload = {
            "bulan": data["bulan"],
            "tahun": data["tahun"],
            "kode": data["kode"],
            "features": data["features"], 
        }
        response = supabase.table("kecamatan_features").insert(payload).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error Supabase Insert: {e}")
        return False
def update_kecamatan_features(doc_id: str, data: dict) -> bool:
    """Update data kecamatan_features berdasarkan Primary Key ID di Supabase."""
    try:
        payload = {
            "bulan": data["bulan"],
            "tahun": data["tahun"],
            "kode": data["kode"],
            "features": data["features"],
            "updated_at": datetime.utcnow().isoformat(),
        }
        response = supabase.table("kecamatan_features").update(payload).eq("id", doc_id).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error Supabase Update: {e}")
        return False
def delete_kecamatan_features(doc_id: str) -> bool:
    try:
        response = supabase.table("kecamatan_features").delete().eq("id", doc_id).execute()
        return bool(response.data)
    except Exception as e:
        print(f"Error Supabase Delete: {e}")
        return False


def get_all_kecamatan_features() -> list:
    try:
        response = (
            supabase.table("kecamatan_features")
            .select("*")
            .order("kode", desc=False)
            .order("tahun", desc=True)
            .order("bulan", desc=True)
            .execute()
        )
        return response.data or []
    except Exception as e:
        print(f"Error Supabase Get All: {e}")
        return []


# --- FUNGSI CUACA JEMBER ---

def get_cuaca_jember() -> dict:
    try:
        response = supabase.table("cuaca_jember").select("*").execute()
        cuaca_map = {}
        for item in response.data:
            kec_code = item.get("kecamatan_kode")
            if kec_code:
                cuaca_map[kec_code] = {
                    "temp_avg": float(item.get("temp_avg", 0)),
                    "humidity_avg": float(item.get("humidity_avg", 0)),
                    "windspeed_avg": float(item.get("windspeed_avg", 0)),
                }
        return cuaca_map
    except Exception as e:
        print(f"Gagal mengambil data cuaca dari Supabase: {e}")
        return {}

def sync_bmkg_data():
    print(f"[{datetime.now()}] Memulai sinkronisasi otomatis per Kecamatan...")
    current_month = datetime.now().month
    current_year = datetime.now().year

    all_features_docs = get_all_kecamatan_features()

    for kec_code, desa_list in DESA_MAPPING.items():
        all_kecamatan_temps = []
        all_kecamatan_hums = []
        all_kecamatan_winds = []

        for adm4 in desa_list:
            try:
                time.sleep(random.uniform(3, 5))
                url = f"https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={adm4}"
                res = requests.get(url, timeout=15).json()

                if res.get('data') and res['data'][0].get('cuaca'):
                    data_cuaca = res['data'][0]['cuaca'][0]
                    all_kecamatan_temps.append(sum([d['t'] for d in data_cuaca]) / len(data_cuaca))
                    all_kecamatan_hums.append(sum([d['hu'] for d in data_cuaca]) / len(data_cuaca))
                    all_kecamatan_winds.append(sum([d['ws'] for d in data_cuaca]) / len(data_cuaca))
            except Exception as e:
                print(f"Skip desa {adm4}: {e}")

        if all_kecamatan_temps:
            avg_temp = round(sum(all_kecamatan_temps) / len(all_kecamatan_temps), 2)
            avg_hum = round(sum(all_kecamatan_hums) / len(all_kecamatan_hums), 2)
            avg_wind = round(sum(all_kecamatan_winds) / len(all_kecamatan_winds), 2)

            cuaca_payload = {
                "kecamatan_kode": kec_code,
                "temp_avg": avg_temp,
                "humidity_avg": avg_hum,
                "windspeed_avg": avg_wind,
                "waktu_sync": datetime.utcnow().isoformat(),
                "total_desa_terhitung": len(all_kecamatan_temps)
            }
            try:
                supabase.table("cuaca_jember").upsert(
                    cuaca_payload, on_conflict="kecamatan_kode"
                ).execute()
                print(f"Berhasil update cuaca_jember Supabase: {kec_code}")
            except Exception as e:
                print(f"Gagal upsert cuaca_jember {kec_code}: {e}")
            for doc in all_features_docs:
                doc_kode = doc.get("kode")
                doc_bulan = int(doc.get("bulan", 0))
                doc_tahun = int(doc.get("tahun", 0))

                if doc_kode == kec_code and doc_bulan == current_month and doc_tahun == current_year:
                    doc_id = doc.get("id")  # Ambil ID primary key Supabase
                    new_features = doc.get("features", {})
                    
                    new_features["suhu_rata2_c"] = avg_temp
                    new_features["kelembaban_persen"] = avg_hum

                    update_payload = {
                        "bulan": current_month,
                        "tahun": current_year,
                        "kode": kec_code,
                        "features": new_features
                    }

                    if update_kecamatan_features(doc_id, update_payload):
                        print(f"Berhasil update features Supabase untuk {kec_code} (Bulan {current_month})")
                    break


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(sync_bmkg_data, 'interval', hours=3)
    scheduler.start()