import requests
import os
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from app.core.config import settings
from app.core.master_data import DESA_MAPPING
import requests
import time
import random
project_id = settings.FIREBASE_PROJECT_ID
api_key = settings.FIREBASE_API_KEY
def format_firestore_data(data: dict):
    fields = {}
    for key, value in data.items():
        if isinstance(value, int):
            fields[key] = {"integerValue": str(value)}
        elif isinstance(value, float):
            fields[key] = {"doubleValue": value}
        else:
            fields[key] = {"stringValue": str(value)}
    return fields

def save_kecamatan_features(data: dict):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/kecamatan_features?key={api_key}"
    payload = {
        "fields": {
            "bulan": {"integerValue": str(data["bulan"])},
            "tahun": {"integerValue": str(data["tahun"])},
            "kode": {"stringValue": data["kode"]},
            "features": {"mapValue": {"fields": format_firestore_data(data["features"])}},
            "createdAt": {"timestampValue": datetime.utcnow().isoformat() + "Z"},
            "updatedAt": {"timestampValue": datetime.utcnow().isoformat() + "Z"}
        }
    }
    response = requests.post(url, json=payload)
    return response.status_code == 200

def update_kecamatan_features(doc_id: str, data: dict):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/kecamatan_features/{doc_id}?key={api_key}"
    payload = {
        "fields": {
            "bulan": {"integerValue": str(data["bulan"])},
            "tahun": {"integerValue": str(data["tahun"])},
            "kode": {"stringValue": data["kode"]},
            "features": {"mapValue": {"fields": format_firestore_data(data["features"])}},
            "updatedAt": {"timestampValue": datetime.utcnow().isoformat() + "Z"}
        }
    }
    response = requests.patch(url, json=payload)
    return response.status_code == 200
def delete_kecamatan_features(doc_id: str):
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/kecamatan_features/{doc_id}?key={api_key}"
    response = requests.delete(url)
    return response.status_code == 200
def get_all_kecamatan_features():
    url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/kecamatan_features?key={api_key}&orderBy=kode asc, tahun desc, bulan desc"
    response = requests.get(url)
    if response.status_code == 200:
        documents = response.json().get("documents", [])
        return documents
    return []
def sync_bmkg_data():
    print(f"[{datetime.now()}] Memulai sinkronisasi otomatis BMKG...")
    
    for kec_code, desa_list in DESA_MAPPING.items():
        for adm4 in desa_list:
            try:
                sleep_time = random.uniform(3, 10)
                time.sleep(sleep_time)
                url = f"https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4={adm4}"
                res = requests.get(url, timeout=15).json()
                if not res.get('data'):
                    continue
                data_cuaca = res['data'][0]['cuaca'][0]
                payload = {
                    "fields": {
                        "kecamatan_kode": {"stringValue": kec_code},
                        "temp_avg": {"doubleValue": round(sum([d['t'] for d in data_cuaca])/len(data_cuaca), 2)},
                        "humidity_avg": {"doubleValue": round(sum([d['hu'] for d in data_cuaca])/len(data_cuaca), 2)},
                        "windspeed_avg": {"doubleValue": round(sum([d['ws'] for d in data_cuaca])/len(data_cuaca), 2)},
                        "waktu_sync": {"timestampValue": datetime.utcnow().isoformat() + "Z"},
                        "raw_data_count": {"integerValue": str(len(data_cuaca))}
                    }
                }
                firestore_url = f"https://firestore.googleapis.com/v1/projects/{project_id}/databases/(default)/documents/cuaca_jember/{adm4}?key={api_key}"
                requests.patch(firestore_url, json=payload)
                print(f"Berhasil update data desa: {adm4}")
            except Exception as e:
                print(f"Gagal update desa {adm4}: {e}")
def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(sync_bmkg_data, 'interval', hours=3)
    scheduler.start()