import json
import time
from pathlib import Path

import requests


BASE_DIR = Path(__file__).resolve().parent

CACHE_PATH = BASE_DIR / "dataset" / "geocoding_cache.json"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

USER_AGENT = "SafeRoute-ML/1.0 (development)"


def load_cache() -> dict:
    if not CACHE_PATH.exists():
        return {}

    try:
        with open(CACHE_PATH, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return {}


def save_cache(cache: dict):
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(
        CACHE_PATH,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            cache,
            file,
            ensure_ascii=False,
            indent=2
        )


def geocode_location(location: str):
    location = location.strip()

    if not location:
        return None

    cache = load_cache()

    cache_key = location.lower()


    if cache_key in cache:
        return cache[cache_key]


    params = {
        "q": f"{location}, Depok, Indonesia",
        "format": "jsonv2",
        "limit": 1,
        "countrycodes": "id"
    }

    headers = {
        "User-Agent": USER_AGENT
    }

    try:
        response = requests.get(
            NOMINATIM_URL,
            params=params,
            headers=headers,
            timeout=15
        )

        response.raise_for_status()

        results = response.json()

        if not results:
            cache[cache_key] = None
            save_cache(cache)

            return None

        result = results[0]

        data = {
            "latitude": float(result["lat"]),
            "longitude": float(result["lon"]),
            "display_name": result.get("display_name")
        }

        cache[cache_key] = data
        save_cache(cache)

        time.sleep(1)

        return data

    except requests.RequestException as error:
        print(f"[GEOCODER ERROR] {error}")

        return None

    result = geocode_location(
        "Jalan Margonda Raya"
    )

    print(result)