# pyrefly: ignore [missing-import]
import spacy

from scraper import scrape_article
from classifier import predict

from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

NER_MODEL_PATH = BASE_DIR / "models" / "saferoute_ner"

ner_model = spacy.load(NER_MODEL_PATH)


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

            locations.append(
                entity.text
            )

        elif entity.label_ == "TIME":

            times.append(
                entity.text
            )


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