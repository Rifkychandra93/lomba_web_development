import requests
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"}

def test_okezone():
    print("=== Okezone ===")
    url = "https://search.okezone.com/search?q=begal+depok"
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.content, "html.parser")
    links = []
    for a in soup.find_all("a"):
        href = a.get("href", "")
        if "okezone.com/read/" in href:
            links.append(href)
    for l in list(set(links))[:3]:
        print("Okezone:", l)

def test_viva():
    print("=== Viva ===")
    url = "https://www.viva.co.id/search?q=begal+depok"
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.content, "html.parser")
    links = []
    for a in soup.find_all("a"):
        href = a.get("href", "")
        if "viva.co.id/berita/" in href:
            links.append(href)
    for l in list(set(links))[:3]:
        print("Viva:", l)

def test_antara():
    print("=== Antara ===")
    url = "https://www.antaranews.com/search?q=begal+depok"
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.content, "html.parser")
    links = []
    for a in soup.find_all("a"):
        href = a.get("href", "")
        if "antaranews.com/berita/" in href:
            links.append(href)
    for l in list(set(links))[:3]:
        print("Antara:", l)

if __name__ == "__main__":
    test_okezone()
    test_viva()
    test_antara()
