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

    params = {
        "q": f"{location}, Depok, Jawa Barat, Indonesia",
        "format": "jsonv2",
        "addressdetails": 1,
        "limit": 5,
        "countrycodes": "id",

        # Fokus wilayah Depok, Jawa Barat
        # format: lon1,lat1,lon2,lat2
        "viewbox": "106.70,-6.50,106.90,-6.30",
        "bounded": 1,
    }

    headers = {
        "User-Agent": "SafeRoute-ML/1.0"
    }

    try:
        response = requests.get(
            NOMINATIM_URL,
            params=params,
            headers=headers,
            timeout=5
        )

        response.raise_for_status()

        results = response.json()

        if not results:
            print("[GEOCODER] lokasi tidak ditemukan:", location)
            return None

        for result in results:

            address = result.get("address", {})

            city = (
                address.get("city")
                or address.get("town")
                or address.get("municipality")
                or ""
            ).lower()

            state = (
                address.get("state")
                or ""
            ).lower()

            country_code = (
                address.get("country_code")
                or ""
            ).lower()

            if country_code != "id":
                continue

            if "depok" not in city:
                continue

            if "jawa barat" not in state:
                continue

            data = {
                "latitude": float(result["lat"]),
                "longitude": float(result["lon"]),
                "display_name": result.get("display_name")
            }

            print("[GEOCODER] berhasil:", data)

            return data

        print(
            f"[GEOCODER] hasil ditemukan, "
            f"tetapi bukan Depok Jawa Barat: {location}"
        )

        return None

    except requests.RequestException as error:
        print(f"[GEOCODER ERROR] {error}")
        return None

    except (KeyError, ValueError, TypeError) as error:
        print(f"[GEOCODER PARSE ERROR] {error}")
        return None

        result = results[0]

        data = {
            "latitude": float(result["lat"]),
            "longitude": float(result["lon"]),
            "display_name": result.get("display_name")
        }

        print("[GEOCODER] berhasil:", data)

        return data

    except requests.RequestException as error:
        print(f"[GEOCODER ERROR] {error}")
        return None

    except (KeyError, ValueError, TypeError) as error:
        print(f"[GEOCODER PARSE ERROR] {error}")
        return None