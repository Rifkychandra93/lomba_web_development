import random
import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

OUTPUT_PATH = (
    BASE_DIR
    / "ner_dataset"
    / "ner_data.json"
)


locations = [
    "Jalan Margonda",
    "Jalan Juanda",
    "Jalan Raya Bogor",
    "Jalan Sawangan",
    "Jalan Kemang",
    "Jalan Sudirman",
    "Jalan Arif Rahman Hakim",
    "Jalan Citayam",
    "Jalan Kartini",
    "Jalan Pemuda",
    "Jalan Siliwangi",
    "Jalan Diponegoro",
    "Jalan Merdeka",
    "Jalan Dewi Sartika",
    "Jalan Nusantara",
]


times = [
    "Senin pagi",
    "Senin malam",
    "Selasa pagi",
    "Selasa malam",
    "Rabu sore",
    "Rabu malam",
    "Kamis pagi",
    "Kamis malam",
    "Jumat sore",
    "Jumat malam",
    "Sabtu pagi",
    "Sabtu malam",
    "Minggu sore",
    "Minggu malam",
]


incidents = [
    "begal",
    "pembegalan",
    "pencurian",
    "kecelakaan",
    "tawuran",
    "kebakaran",
]


templates = [
    "Terjadi {incident} di {location} pada {time}.",

    "Polisi menangani kasus {incident} di {location} pada {time}.",

    "Warga melaporkan {incident} di {location} pada {time}.",

    "Petugas menerima laporan {incident} di {location} pada {time}.",

    "Aksi {incident} terjadi di {location} pada {time}.",

    "Kasus {incident} dilaporkan terjadi di {location} pada {time}.",

    "Peristiwa {incident} terjadi sekitar {location} pada {time}.",

    "Polisi menerima laporan terkait {incident} di {location} pada {time}.",
]


def create_entity(text, entity_text, label):

    start = text.find(entity_text)

    if start == -1:
        return None

    end = start + len(entity_text)

    return {
        "start": start,
        "end": end,
        "label": label
    }


def generate_dataset(total=500):

    dataset = []

    for _ in range(total):

        incident = random.choice(incidents)
        location = random.choice(locations)
        time = random.choice(times)

        template = random.choice(templates)

        text = template.format(
            incident=incident,
            location=location,
            time=time
        )

        entities = []

        incident_entity = create_entity(
            text,
            incident,
            "INCIDENT"
        )

        location_entity = create_entity(
            text,
            location,
            "LOCATION"
        )

        time_entity = create_entity(
            text,
            time,
            "TIME"
        )

        if incident_entity:
            entities.append(incident_entity)

        if location_entity:
            entities.append(location_entity)

        if time_entity:
            entities.append(time_entity)

        dataset.append({
            "text": text,
            "entities": entities
        })

    return dataset


if __name__ == "__main__":

    dataset = generate_dataset(500)

    with open(
        OUTPUT_PATH,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            dataset,
            file,
            ensure_ascii=False,
            indent=2
        )

    print(
        f"Dataset NER berhasil dibuat: "
        f"{len(dataset)} data"
    )

    print(
        f"File: {OUTPUT_PATH}"
    )