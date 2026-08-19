import csv
import random
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DATASET_PATH = BASE_DIR / "dataset" / "berita.csv"


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


templates = {

    "BEGAL": [
        "Polisi menangkap pelaku begal di {loc} pada {time}.",
        "Terjadi aksi pembegalan terhadap pengendara di {loc} pada {time}.",
        "Warga melaporkan aksi begal di {loc} saat {time}.",
        "Pengendara menjadi korban begal di {loc} pada {time}.",
        "Kasus pembegalan terjadi di kawasan {loc} pada {time}.",
    ],

    "PENCURIAN": [
        "Kasus pencurian sepeda motor terjadi di {loc} pada {time}.",
        "Pelaku pencurian ditangkap polisi di {loc} pada {time}.",
        "Warga melaporkan pencurian kendaraan di {loc} saat {time}.",
        "Sepeda motor warga dicuri di {loc} pada {time}.",
        "Pencurian barang terjadi di kawasan {loc} pada {time}.",
    ],

    "PEMBACOKAN": [
        "Dua warga menjadi korban pembacokan di {loc} pada {time}.",
        "Polisi menangani kasus pembacokan di {loc} pada {time}.",
        "Seorang pria dibacok di {loc} saat {time}.",
        "Warga melaporkan aksi pembacokan di {loc} pada {time}.",
        "Korban pembacokan ditemukan di kawasan {loc} pada {time}.",
    ],

    "KECELAKAAN": [
        "Kecelakaan lalu lintas terjadi di {loc} pada {time}.",
        "Dua kendaraan bertabrakan di {loc} saat {time}.",
        "Seorang pengendara mengalami kecelakaan di {loc} pada {time}.",
        "Kecelakaan kendaraan terjadi di kawasan {loc} pada {time}.",
        "Polisi menangani kecelakaan lalu lintas di {loc} pada {time}.",
    ],

    "TAWURAN": [
        "Tawuran antar remaja terjadi di {loc} pada {time}.",
        "Polisi membubarkan aksi tawuran di {loc} saat {time}.",
        "Sejumlah pelaku tawuran diamankan di {loc} pada {time}.",
        "Warga melaporkan tawuran di kawasan {loc} pada {time}.",
        "Bentrokan antar kelompok terjadi di {loc} pada {time}.",
    ],

    "KEBAKARAN": [
        "Kebakaran rumah terjadi di {loc} pada {time}.",
        "Api melalap sebuah toko di {loc} saat {time}.",
        "Petugas memadamkan kebakaran di {loc} pada {time}.",
        "Kebakaran terjadi di kawasan {loc} pada {time}.",
        "Sebuah bangunan terbakar di {loc} pada {time}.",
    ],
}


rows = []


for label, sentence_templates in templates.items():

    for _ in range(40):

        text = random.choice(sentence_templates).format(
            loc=random.choice(locations),
            time=random.choice(times)
        )

        rows.append({
            "text": text,
            "label": label
        })


random.shuffle(rows)


DATASET_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)


with open(
    DATASET_PATH,
    "w",
    newline="",
    encoding="utf-8"
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=["text", "label"]
    )

    writer.writeheader()
    writer.writerows(rows)


print(
    f"Dataset berhasil dibuat: {len(rows)} data"
)

print(
    "Kategori:"
)

for label in templates:
    print(
        f"- {label}: 40 data"
    )