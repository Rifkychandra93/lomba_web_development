import requests
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup
from datetime import datetime


def scrape_article(url: str):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/151.0.0.0 Safari/537.36"
        )
    }

    response = requests.get(
        url,
        headers=headers,
        timeout=15
    )

    response.raise_for_status()

    soup = BeautifulSoup(
        response.text,
        "html.parser"
    )


    title = ""

    if soup.find("h1"):
        title = soup.find("h1").get_text(
            " ",
            strip=True
        )

    elif soup.title:
        title = soup.title.get_text(
            " ",
            strip=True
        )


    paragraphs = soup.find_all("p")

    content_parts = []

    for paragraph in paragraphs:

        text = paragraph.get_text(
            " ",
            strip=True
        )

        if text:
            content_parts.append(text)

    content = " ".join(content_parts)


    published_at = None

    time_tag = soup.find("time")

    if time_tag:

        published_at = (
            time_tag.get("datetime")
            or time_tag.get_text(
                " ",
                strip=True
            )
        )


    return {
        "title": title,
        "content": content,
        "published_at": published_at,
        "source_url": url,
        "scraped_at": datetime.now().isoformat()
    }


if __name__ == "__main__":

    url = input("Masukkan URL berita: ")

    try:

        article = scrape_article(url)

        print("\n==============================")
        print("HASIL SCRAPING")
        print("==============================")

        print("\nJudul:")
        print(article["title"])

        print("\nTanggal:")
        print(article["published_at"])

        print("\nURL:")
        print(article["source_url"])

        print("\nIsi:")
        print(article["content"][:1000])

    except Exception as error:

        print("\nGagal melakukan scraping:")
        print(error)