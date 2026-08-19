import requests
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup
import json
import time
from pathlib import Path

# Import scraper dan pipeline yang sudah ada
from scraper import scrape_article
from pipeline import analyze_article

BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset"
DATASET_DIR.mkdir(exist_ok=True)
OUTPUT_FILE = DATASET_DIR / "scraped_real_cases.json"

# Fokus ke Depok
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
            time.sleep(1) # delay antar halaman
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
                
                # Filter Depok
                title = analysis["article"]["title"]
                content = analysis["article"]["content"]
                full_text = title + " " + content
                
                if not is_in_depok(analysis["analysis"]["locations"], full_text):
                    print(f"    -> [DITOLAK] Bukan kasus di Depok.")
                    continue

                all_results.append(analysis)
                print(f"    -> [DITERIMA] Kategori: {analysis['analysis']['category']} (Confidence: {analysis['analysis']['confidence']})")
                print(f"    -> Lokasi: {analysis['analysis']['locations']}")
                
                time.sleep(2)
            except Exception as e:
                print(f"    -> Gagal memproses: {e}")
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
        
    print(f"\nSelesai! Total data saat ini: {len(all_results)}")
    print(f"Disimpan di: {OUTPUT_FILE}")

if __name__ == "__main__":
    crawl_and_analyze()
