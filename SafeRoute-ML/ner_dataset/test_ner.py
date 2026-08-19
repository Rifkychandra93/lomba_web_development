import spacy
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "saferoute_ner"

nlp = spacy.load(MODEL_PATH)


TEST_DATA = [
    "Warga melaporkan aksi begal di Jalan Margonda pada malam hari.",
    "Terjadi kecelakaan di Jalan Raya Bogor pada pagi hari.",
    "Polisi mengamankan pelaku tawuran di Jalan Juanda Depok.",
    "Pencurian sepeda motor terjadi di Jalan Kemang pada Jumat malam.",
    "Kebakaran terjadi di Jalan Sawangan pada Minggu sore.",
]


for text in TEST_DATA:

    doc = nlp(text)

    print("\n================================")
    print("TEXT:")
    print(text)

    print("\nENTITIES:")

    if not doc.ents:
        print("Tidak ada entity yang terdeteksi.")
    else:
        for ent in doc.ents:
            print(
                f"- {ent.text} → {ent.label_}"
            )