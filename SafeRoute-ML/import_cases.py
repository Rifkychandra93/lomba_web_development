import os
import json
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from mapper import map_incident_type
from risk_classifier import calculate_risk
from geocoder import geocode_location

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "dataset" / "scraped_real_cases.json"

BACKEND_ML_URL = os.getenv("BACKEND_ML_URL")
ML_API_KEY = os.getenv("ML_API_KEY")

if not BACKEND_ML_URL:
    raise RuntimeError("BACKEND_ML_URL belum diisi di .env")

if not ML_API_KEY:
    raise RuntimeError("ML_API_KEY belum diisi di .env")

def is_in_depok(locations, text):
    text = text.lower()
    if "depok" in text:
        return True
    for loc in locations:
        if "depok" in loc.lower():
            return True
    return False

def send_incident_to_backend(analysis: dict, url: str) -> bool:
    article = analysis["article"]
    ana = analysis["analysis"]
    
    title = article["title"]
    content = article["content"]
    category = ana["category"]
    confidence = float(ana["confidence"])
    
    incident_type = map_incident_type(category)
    risk_level = calculate_risk(confidence)
    
    locations = ana.get("locations", [])
    coords = None
    location_name = "Depok"
    
    for loc in locations:
        if len(loc.strip()) < 3:
            continue
        coords = geocode_location(loc)
        if coords:
            location_name = loc
            break
            
    if not coords:
        location_name = "Depok"
        coords = geocode_location("Depok")
        
    if not coords:
        print(f"       [SKIPPED] Geocoding gagal untuk lokasi fallback: {location_name}")
        return False
        
    payload = {
        "title": title,
        "url": url,
        "description": content,
        "source": article.get("source", "Internet"),
        "publishedAt": None,
        
        "incidentTitle": f"[{incident_type}] {title[:50]}...",
        "incidentDescription": content[:200] + "..." if content else None,
        
        "location": location_name,
        "latitude": coords["latitude"],
        "longitude": coords["longitude"],
        
        "incidentType": incident_type,
        "riskLevel": risk_level,
        "mlConfidence": confidence
    }
    
    headers = {
        "x-ml-key": ML_API_KEY
    }
    
    try:
        response = requests.post(BACKEND_ML_URL, json=payload, headers=headers, timeout=20)
        if response.status_code == 201:
            print(f"    -> [DATABASE SAVED] Berhasil disimpan di backend DB (Lokasi: {location_name}).")
            return True
        elif response.status_code == 409:
            print(f"    -> [DATABASE SKIPPED] Data sudah ada di backend DB (duplikat).")
            return True
        else:
            print(f"    -> [DATABASE ERROR] Gagal menyimpan ke backend DB: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"    -> [DATABASE ERROR] Gagal menghubungi backend: {e}")
        return False

def import_all():
    if not INPUT_FILE.exists():
        print(f"File {INPUT_FILE} tidak ditemukan!")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        cases = json.load(f)

    print(f"Total kasus dalam JSON: {len(cases)}")
    depok_count = 0
    saved_count = 0
    skipped_count = 0

    for idx, case in enumerate(cases):
        article = case.get("article", {})
        analysis = case.get("analysis", {})
        title = article.get("title", "")
        content = article.get("content", "")
        url = article.get("source_url", "")
        
        full_text = f"{title} {content}"
        locations = analysis.get("locations", [])
        
        if not is_in_depok(locations, full_text):
            continue
            
        depok_count += 1
        print(f"[{depok_count}] Memproses berita: {title[:60]}...")
        
        success = send_incident_to_backend(case, url)
        if success:
            saved_count += 1
        else:
            skipped_count += 1
        
        time.sleep(0.05)

    print("\n==============================")
    print("PROSES IMPORT SELESAI")
    print("==============================")
    print(f"Total kasus di Depok: {depok_count}")
    print(f"Berhasil disimpan / duplikat terdaftar: {saved_count}")
    print(f"Gagal / Lewati: {skipped_count}")

if __name__ == "__main__":
    import_all()
