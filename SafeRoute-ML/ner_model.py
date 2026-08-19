import re
# pyrefly: ignore [missing-import]
import spacy
# pyrefly: ignore [missing-import]
from spacy.pipeline import EntityRuler


def create_ner_model():
    """
    Membuat model NER baseline menggunakan spaCy EntityRuler.
    """

    nlp = spacy.blank("id")

    ruler = nlp.add_pipe("entity_ruler")

    patterns = [
        # Lokasi
        {
            "label": "LOCATION",
            "pattern": [
                {"LOWER": "jalan"},
                {"IS_TITLE": True, "OP": "+"}
            ]
        },
        {
            "label": "LOCATION",
            "pattern": [
                {"LOWER": "jl."},
                {"IS_TITLE": True, "OP": "+"}
            ]
        },

        # Waktu
        {
            "label": "TIME",
            "pattern": [
                {"LOWER": {"IN": ["senin", "selasa", "rabu", "kamis",
                                   "jumat", "sabtu", "minggu"]}}
            ]
        },
        {
            "label": "TIME",
            "pattern": [
                {"LOWER": "malam"}
            ]
        },
        {
            "label": "TIME",
            "pattern": [
                {"LOWER": "pagi"}
            ]
        },
        {
            "label": "TIME",
            "pattern": [
                {"LOWER": "siang"}
            ]
        },
        {
            "label": "TIME",
            "pattern": [
                {"LOWER": "sore"}
            ]
        }
    ]

    ruler.add_patterns(patterns)

    return nlp


def extract_entities(text: str):
    nlp = create_ner_model()

    doc = nlp(text)

    entities = []

    for ent in doc.ents:
        entities.append({
            "text": ent.text,
            "label": ent.label_
        })

    return entities


def analyze_location_and_time(text: str):
    entities = extract_entities(text)

    locations = []
    times = []

    for entity in entities:

        if entity["label"] == "LOCATION":
            locations.append(entity["text"])

        elif entity["label"] == "TIME":
            times.append(entity["text"])

    return {
        "locations": locations,
        "times": times
    }


if __name__ == "__main__":

    text = (
        "Polisi menangkap pelaku begal "
        "di Jalan Margonda, Depok pada Senin malam."
    )

    result = analyze_location_and_time(text)

    print("=== HASIL NER ===")
    print(result)