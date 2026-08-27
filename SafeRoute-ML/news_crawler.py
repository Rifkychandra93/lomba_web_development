import os
import requests
import re
from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup
import json
import time
from pathlib import Path

from scraper import scrape_article
from pipeline import analyze_article
from mapper import map_incident_type
from risk_classifier import calculate_risk
from geocoder import geocode_location

def parse_date_indonesia(date_str: str) -> datetime:
    if not date_str:
        return None
        
    date_str = date_str.strip()
    
    try:
        return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
    except Exception:
        pass

    months_map = {
        'jan': 1, 'januari': 1,
        'feb': 2, 'februari': 2,
        'mar': 3, 'maret': 3,
        'apr': 4, 'april': 4,
        'mei': 5,
        'jun': 6, 'juni': 6,
        'jul': 7, 'juli': 7,
        'agu': 8, 'agustus': 8, 'agt': 8,
        'sep': 9, 'september': 9,
        'okt': 10, 'oktober': 10,
        'nov': 11, 'november': 11,
        'des': 12, 'desember': 12
    }
    
    cleaned = date_str.lower()
    for day in ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu', 'hari', 'ini', 'lalu']:
        cleaned = cleaned.replace(day, '')
    
    cleaned = re.sub(r'[,\.\-]', ' ', cleaned)
    cleaned = cleaned.replace('wib', '').replace('wita', '').replace('wit', '')
    
    tokens = cleaned.split()
    if not tokens:
        return None
        
    day = None
    month = None
    year = None
    time_str = "00:00:00"
    
    for tok in tokens:
        if tok in months_map:
            month = months_map[tok]
            break
            
    if month:
        # Find and remove the month token
        month_tok = [tok for tok in tokens if tok in months_map][0]
        tokens.remove(month_tok)
        
    digits = []
    for tok in tokens:
        if tok.isdigit():
            digits.append(int(tok))
        elif ':' in tok:
            time_parts = tok.split(':')
            if len(time_parts) >= 2:
                try:
                    h = int(time_parts[0])
                    m = int(time_parts[1])
                    s = int(time_parts[2]) if len(time_parts) > 2 else 0
                    time_str = f"{h:02d}:{m:02d}:{s:02d}"
                except ValueError:
                    pass
                    
    for num in digits:
        if 1900 < num < 2100:
            year = num
        elif 1 <= num <= 31:
            if day is None:
                day = num

    if day and month and year:
        try:
            h, m, s = map(int, time_str.split(':'))
            return datetime(year, month, day, h, m, s)
        except Exception:
            pass
            
    for fmt in [
        "%d %b %Y %H:%M",
        "%d %B %Y %H:%M",
        "%Y-%m-%d %H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
        "%d-%m-%Y %H:%M:%S"
    ]:
        try:
            return datetime.strptime(date_str, fmt)
        except Exception:
            pass
            
    return None

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
DATASET_DIR.mkdir(exist_ok=True)
OUTPUT_FILE = DATASET_DIR / "scraped_real_cases.json"

BACKEND_ML_URL = os.getenv("BACKEND_ML_URL")
ML_API_KEY = os.getenv("ML_API_KEY")

if not BACKEND_ML_URL:
    raise RuntimeError("BACKEND_ML_URL belum d isi")

if not ML_API_KEY:
    raise RuntimeError("ML_API belum di isi")

KEYWORDS = ["begal depok", "tawuran depok", "pembacokan depok", "perampokan depok"]

def search_detik(keyword, max_pages=2):
    print(f"  -> Mencari di detik.com: '{keyword}'")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    links = []
    
    for page in range(1, max_pages + 1):
        url = f"https://www.detik.com/search/searchall?query={keyword}&page={page}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            articles = soup.find_all("article")
            for article in articles:
                a_tag = article.find("a")
                if a_tag and a_tag.get("href"):
                    links.append(a_tag.get("href"))
            time.sleep(1)
        except Exception as e:
            print(f"     Gagal detik (page {page}): {e}")
            
    return list(set(links))

def search_suara(keyword, max_pages=2):
    print(f"  -> Mencari di suara.com: '{keyword}'")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    links = set()
    
    for page in range(1, max_pages + 1):
        url = f"https://www.suara.com/search?q={keyword}&page={page}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            for a in soup.find_all("a"):
                href = a.get("href", "")
                if "suara.com/news/" in href or "suara.com/kriminal/" in href:
                    links.add(href)
            time.sleep(1)
        except Exception as e:
            print(f"     Gagal suara (page {page}): {e}")
            
    return list(links)

def search_liputan6(keyword, max_pages=2):
    print(f"  -> Mencari di liputan6.com: '{keyword}'")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    links = set()
    
    for page in range(1, max_pages + 1):
        url = f"https://www.liputan6.com/search?q={keyword}&page={page}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            for a in soup.find_all("a"):
                href = a.get("href", "")
                if "liputan6.com/news/read/" in href:
                    links.add(href)
            time.sleep(1)
        except Exception as e:
            print(f"     Gagal liputan6 (page {page}): {e}")
            
    return list(links)

def search_viva(keyword, max_pages=2):
    print(f"  -> Mencari di viva.co.id: '{keyword}'")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    links = set()
    
    for page in range(1, max_pages + 1):
        url = f"https://www.viva.co.id/search?q={keyword}&page={page}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            for a in soup.find_all("a"):
                href = a.get("href", "")
                if "viva.co.id/berita/" in href:
                    links.add(href)
            time.sleep(1)
        except Exception as e:
            print(f"     Gagal viva (page {page}): {e}")
            
    return list(links)

def search_antara(keyword, max_pages=2):
    print(f"  -> Mencari di antaranews.com: '{keyword}'")
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    links = set()
    
    for page in range(1, max_pages + 1):
        url = f"https://www.antaranews.com/search?q={keyword}&page={page}"
        try:
            response = requests.get(url, headers=headers, timeout=10)
            soup = BeautifulSoup(response.content, "html.parser")
            for a in soup.find_all("a"):
                href = a.get("href", "")
                if "antaranews.com/berita/" in href:
                    links.add(href)
            time.sleep(1)
        except Exception as e:
            print(f"     Gagal antara (page {page}): {e}")
            
    return list(links)

def search_internet(keyword):
    """
    Menggabungkan hasil dari 5 sumber utama
    """
    print(f"\nMencari berita untuk keyword: '{keyword}'...")
    links = []
    links.extend(search_detik(keyword, max_pages=2))
    links.extend(search_suara(keyword, max_pages=2))
    links.extend(search_liputan6(keyword, max_pages=2))
    links.extend(search_viva(keyword, max_pages=2))
    links.extend(search_antara(keyword, max_pages=2))
    
    unique_links = list(set([l for l in links if l.startswith("http")]))
    print(f"Ditemukan {len(unique_links)} link unik untuk '{keyword}'.")
    return unique_links

def is_in_depok(locations, text):
    """
    Cek apakah lokasi kejadian di Depok atau setidaknya kata depok ada di teks.
    """
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
        
    pub_date = parse_date_indonesia(article.get("published_at"))
    published_at_iso = pub_date.isoformat() if pub_date else None

    payload = {
        "title": title,
        "url": url,
        "description": content,
        "source": article.get("source", "Internet"),
        "publishedAt": published_at_iso,
        
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
            print(f"    -> [DATABASE SAVED] Berhasil disimpan di backend DB.")
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

def crawl_and_analyze():
    all_results = []
    
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                all_results = json.load(f)
        except Exception:
            all_results = []

    existing_links = {res.get("article", {}).get("source_url") for res in all_results}

    for keyword in KEYWORDS:
        links = search_internet(keyword)
        
        for link in links:
            if link in existing_links:
                print(f"  [SKIPPED] {link[:50]}... (Sudah ada di dataset)")
                continue
                
            print(f"  [SCRAPING] {link}")
            try:
                analysis = analyze_article(link)
                
                # Cek filter tanggal: hanya terima yang kurang dari 1 bulan (30 hari)
                published_at_str = analysis.get("article", {}).get("published_at")
                if published_at_str:
                    pub_date = parse_date_indonesia(published_at_str)
                    if pub_date:
                        one_month_ago = datetime.now() - timedelta(days=30)
                        if pub_date < one_month_ago:
                            print(f"    -> [DITOLAK] Berita sudah lebih dari 1 bulan ({published_at_str}).")
                            continue
                
                title = analysis["article"]["title"]
                content = analysis["article"]["content"]
                full_text = title + " " + content
                
                if not is_in_depok(analysis["analysis"]["locations"], full_text):
                    print(f"    -> [DITOLAK] Bukan kasus di Depok.")
                    continue

                all_results.append(analysis)
                print(f"    -> [DITERIMA] Kategori: {analysis['analysis']['category']} (Confidence: {analysis['analysis']['confidence']})")
                print(f"    -> Lokasi: {analysis['analysis']['locations']}")
                
                send_incident_to_backend(analysis, link)
                
                time.sleep(2)
            except Exception as e:
                print(f"    -> Gagal memproses: {e}")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
        
    print(f"\nSelesai! Total data saat ini: {len(all_results)}")
    print(f"Disimpan di: {OUTPUT_FILE}")

if __name__ == "__main__":
    crawl_and_analyze()
