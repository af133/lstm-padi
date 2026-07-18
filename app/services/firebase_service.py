import requests
import os
from datetime import datetime
from app.core.config import settings

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