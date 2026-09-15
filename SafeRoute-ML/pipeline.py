# pyrefly: ignore [missing-import]
import spacy

from scraper import scrape_article
from classifier import predict

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

NER_MODEL_PATH = BASE_DIR / "models" / "saferoute_ner"

ner_model = spacy.load(NER_MODEL_PATH)

LOCATION_STOPWORDS = {
    "ngaku",
    "ngaku sakit",
    "berujung damai",
    "korban maafkan",
    "korban",
    "pelaku",
    "bernama",
    "detik-detik",
    "tangan",
    "sakit hati",
}


def is_valid_location(entity_text: str) -> bool:
    text = entity_text.strip()
    lower = text.lower()

    if not text:
        return False

    if len(text) < 4:
        return False

    if not any(char.isalpha() for char in text):
        return False

    if text[0] in ",.;:!?)]}":
        return False

    invalid_phrases = [
        "korban",
        "pelaku",
        "bernama",
        "ngaku",
        "berujung",
        "sakit hati",
        "tangan",
        "seorang",
        "tiba-tiba",
        "detik-detik",
        "27)",
    ]

    if any(
        phrase in lower
        for phrase in invalid_phrases
    ):
        return False

    location_indicators = [
        "jalan",
        "jl.",
        "gang",
        "gg.",
        "kelurahan",
        "kecamatan",
        "depok",
        "pancoran",
        "sawangan",
        "beji",
        "cinere",
        "cimanggis",
        "sukmajaya",
        "tapos",
        "cilodong",
        "bojongsari",
        "limo",
        "margonda",
        "kukusan",
        "mekarsari",
        "harjamukti",
        "pasir gunung selatan",
        "polsek",
    ]

    has_location_indicator = any(
        indicator in lower
        for indicator in location_indicators
    )

    if not has_location_indicator:
        return False

    return True

def normalize_location(location: str) -> str:
    text = location.strip()

    prefixes = [
        "ke ",
        "di ",
        "dari ",
        "sekitar ",
        "wilayah ",
        "kawasan ",
    ]

    lower = text.lower()

    for prefix in prefixes:
        if lower.startswith(prefix):
            text = text[len(prefix):].strip()
            break

    return text


def analyze_article(url: str):


    article = scrape_article(url)

    text = (
        article["title"]
        + " "
        + article["content"]
    )

    classification = predict(text)

    doc = ner_model(text)

    locations = []
    times = []

    for entity in doc.ents:

        if entity.label_ == "LOCATION":

            if is_valid_location(entity.text):

                location = normalize_location(
                    entity.text
                )

                if location:
                    locations.append(location)

        elif entity.label_ == "TIME":

            times.append(entity.text)


    return {
        "article": article,

        "analysis": {
            "category": classification["category"],

            "confidence": classification["confidence"],

            "locations": locations,

            "times": times
        }
    }


if __name__ == "__main__":

    url = input(
        "Masukkan URL berita: "
    )

    try:

        result = analyze_article(url)

        print("\n")
        print("==============================")
        print("HASIL ANALISIS SAFEROUTE")
        print("==============================")

        print("\nJudul:")
        print(
            result["article"]["title"]
        )

        print("\nKategori:")
        print(
            result["analysis"]["category"]
        )

        print("\nConfidence:")
        print(
            result["analysis"]["confidence"]
        )

        print("\nLokasi:")

        for location in result["analysis"]["locations"]:
            print(
                f"- {location}"
            )

        print("\nWaktu:")

        for time in result["analysis"]["times"]:
            print(
                f"- {time}"
            )

    except Exception as error:

        print("\nGagal menganalisis berita:")
        print(error)