import spacy
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "saferoute_ner"


TRAIN_DATA_RAW = [
    (
        "Polisi menangkap pelaku begal di Jalan Margonda pada Senin malam.",
        [
            ("Jalan Margonda", "LOCATION"),
            ("Senin malam", "TIME"),
        ],
    ),
    (
        "Terjadi pembegalan di Jalan Juanda Depok pada Selasa malam.",
        [
            ("Jalan Juanda Depok", "LOCATION"),
            ("Selasa malam", "TIME"),
        ],
    ),
    (
        "Kecelakaan terjadi di Jalan Raya Bogor pada Rabu pagi.",
        [
            ("Jalan Raya Bogor", "LOCATION"),
            ("Rabu pagi", "TIME"),
        ],
    ),
    (
        "Tawuran terjadi di Jalan Sudirman pada Kamis malam.",
        [
            ("Jalan Sudirman", "LOCATION"),
            ("Kamis malam", "TIME"),
        ],
    ),
    (
        "Pencurian sepeda motor terjadi di Jalan Sawangan pada Jumat sore.",
        [
            ("Jalan Sawangan", "LOCATION"),
            ("Jumat sore", "TIME"),
        ],
    ),
    (
        "Polisi mengamankan pelaku di Jalan Kemang pada Sabtu malam.",
        [
            ("Jalan Kemang", "LOCATION"),
            ("Sabtu malam", "TIME"),
        ],
    ),
    (
        "Kebakaran terjadi di Jalan Margonda Depok pada Minggu malam.",
        [
            ("Jalan Margonda Depok", "LOCATION"),
            ("Minggu malam", "TIME"),
        ],
    ),
    (
        "Aksi begal terjadi di kawasan Jalan Juanda pada malam hari.",
        [
            ("Jalan Juanda", "LOCATION"),
            ("malam hari", "TIME"),
        ],
    ),
    (
        "Kecelakaan terjadi dekat Jalan Margonda pada pagi hari.",
        [
            ("Jalan Margonda", "LOCATION"),
            ("pagi hari", "TIME"),
        ],
    ),
    (
        "Perkelahian terjadi sekitar Jalan Raya Bogor pada malam hari.",
        [
            ("Jalan Raya Bogor", "LOCATION"),
            ("malam hari", "TIME"),
        ],
    ),
]


def prepare_training_data():

    training_data = []

    for text, entities in TRAIN_DATA_RAW:

        annotations = []

        for entity_text, label in entities:

            start = text.find(entity_text)

            if start == -1:
                print(
                    f"WARNING: '{entity_text}' "
                    f"tidak ditemukan di:\n{text}"
                )
                continue

            end = start + len(entity_text)

            annotations.append(
                (start, end, label)
            )

        training_data.append(
            (text, {"entities": annotations})
        )

    return training_data


def train_ner():

    TRAIN_DATA = prepare_training_data()

    nlp = spacy.blank("id")

    ner = nlp.add_pipe("ner")

    ner.add_label("LOCATION")
    ner.add_label("TIME")

    optimizer = nlp.initialize()

    print("=== MULAI TRAINING NER ===")

    for iteration in range(100):

        losses = {}

        for text, annotations in TRAIN_DATA:

            doc = nlp.make_doc(text)

            example = spacy.training.Example.from_dict(
                doc,
                annotations
            )

            nlp.update(
                [example],
                drop=0.1,
                sgd=optimizer,
                losses=losses
            )

        if (iteration + 1) % 10 == 0:
            print(
                f"Iteration {iteration + 1}/100 "
                f"- Loss: {losses}"
            )

    MODEL_PATH.mkdir(
        parents=True,
        exist_ok=True
    )

    nlp.to_disk(MODEL_PATH)

    print("\n==============================")
    print("MODEL NER BERHASIL DISIMPAN")
    print("==============================")
    print(MODEL_PATH)


if __name__ == "__main__":
    train_ner()