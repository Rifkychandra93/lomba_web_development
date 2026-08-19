import json
import csv
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

INPUT_PATH = (
    BASE_DIR
    / "dataset"
    / "scraped_real_cases.json"
)

OUTPUT_PATH = (
    BASE_DIR
    / "dataset"
    / "real_training.csv"
)


CATEGORY_KEYWORDS = {

    "BEGAL": [
        "begal",
        "pembegalan",
        "dibegal",
        "membegal"
    ],

    "PENCURIAN": [
        "pencurian",
        "mencuri",
        "dicuri",
        "curanmor",
        "pencuri"
    ],

    "PEMBACOKAN": [
        "pembacokan",
        "dibacok",
        "membacok",
        "bacok"
    ],

    "TAWURAN": [
        "tawuran",
        "bentrok",
        "bentrokan",
        "perkelahian"
    ],

    "KECELAKAAN": [
        "kecelakaan",
        "tabrakan",
        "menabrak",
        "ditabrak",
        "tabrak"
    ],

    "KEBAKARAN": [
        "kebakaran",
        "terbakar",
        "kebakaran"
    ]
}


def determine_category(text):

    text = text.lower()

    scores = {}

    for category, keywords in CATEGORY_KEYWORDS.items():

        score = 0

        for keyword in keywords:

            if keyword in text:
                score += 1

        scores[category] = score

    best_category = max(
        scores,
        key=scores.get
    )

    best_score = scores[best_category]

    if best_score == 0:

        return None

    return best_category


with open(
    INPUT_PATH,
    "r",
    encoding="utf-8"
) as file:

    articles = json.load(file)


rows = []


for item in articles:

    article = item.get("article", {})

    title = article.get(
        "title",
        ""
    )

    content = article.get(
        "content",
        ""
    )

    text = (
        title
        + " "
        + content
    )

    category = determine_category(
        text
    )

    if category is None:

        print(
            "[SKIP] Tidak bisa menentukan kategori:"
        )

        print(title)

        continue

    rows.append({
        "text": text,
        "label": category
    })


with open(
    OUTPUT_PATH,
    "w",
    newline="",
    encoding="utf-8"
) as file:

    writer = csv.DictWriter(
        file,
        fieldnames=[
            "text",
            "label"
        ]
    )

    writer.writeheader()

    writer.writerows(rows)


print("\n==============================")
print("REAL DATASET")
print("==============================")

print(
    f"Total data: {len(rows)}"
)

for category in CATEGORY_KEYWORDS:

    total = sum(
        1
        for row in rows
        if row["label"] == category
    )

    print(
        f"{category}: {total}"
    )

print(
    f"\nDisimpan di:\n{OUTPUT_PATH}"
)