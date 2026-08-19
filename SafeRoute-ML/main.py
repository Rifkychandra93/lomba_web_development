import os
from pathlib import Path
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

import json
from pathlib import Path

import requests
# pyrefly: ignore [missing-import]
import spacy

# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

from classifier import predict
from mapper import map_incident_type
from risk_classifier import calculate_risk
from geocoder import geocode_location
    

BASE_DIR = Path(__file__).resolve().parent

NER_MODEL_PATH = BASE_DIR / "models" / "saferoute_ner"
INCIDENTS_JSON_PATH = BASE_DIR / "dataset" / "scraped_real_cases.json"

BACKEND_ML_URL = os.getenv("BACKEND_ML_URL")
ML_API_KEY = os.getenv("ML_API_KEY")

if not BACKEND_ML_URL:
    raise RuntimeError("BACKEND_ML_URL belum diisi di .env")

if not ML_API_KEY:
    raise RuntimeError("ML_API_KEY belum diisi di .env")



ner_model = spacy.load(NER_MODEL_PATH)



app = FastAPI(
    title="SafeRoute ML Service",
    description="Machine Learning service untuk SafeRoute",
    version="1.0.0"
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class AnalyzeRequest(BaseModel):
    text: str


class SendToBackendRequest(BaseModel):
    title: str
    url: str
    description: str | None = None
    source: str | None = None
    publishedAt: str | None = None

    incidentTitle: str
    incidentDescription: str | None = None

    location: str

    incidentType: str
    riskLevel: str
    mlConfidence: float



@app.get("/")
def root():
    return {
        "message": "SafeRoute ML Service is running",
        "status": "success"
    }



@app.get("/health")
def health():
    return {
        "status": "healthy"
    }



@app.post("/analyze")
def analyze(request: AnalyzeRequest):

    text = request.text


    classification = predict(text)

    category = classification["category"]
    confidence = float(classification["confidence"])


    incident_type = map_incident_type(category)

    risk_level = calculate_risk(confidence)


    doc = ner_model(text)

    locations = []
    times = []

    for entity in doc.ents:

        if entity.label_ == "LOCATION":
            locations.append(entity.text)

        elif entity.label_ == "TIME":
            times.append(entity.text)

    coordinates = None

    if locations:
        coordinates = geocode_location(
            locations[0]
        )


    return {
        "success": True,
        "data": {
            "category": category,
            "incidentType": incident_type,
            "confidence": confidence,
            "riskLevel": risk_level,
            "locations": locations,
            "times": times
        }
    }



@app.post("/send-to-backend")
def send_to_backend(request: SendToBackendRequest):

    coordinates = geocode_location(
        request.location
    )

    if not coordinates:
        return {
            "success": False,
            "message": "Lokasi tidak berhasil ditemukan"
        }

    payload = {
        "title": request.title,
        "url": request.url,
        "description": request.description,
        "source": request.source,
        "publishedAt": request.publishedAt,

        "incidentTitle": request.incidentTitle,
        "incidentDescription": request.incidentDescription,

        "location": request.location,

        "latitude": coordinates["latitude"],
        "longitude": coordinates["longitude"],

        "incidentType": request.incidentType,
        "riskLevel": request.riskLevel,
        "mlConfidence": request.mlConfidence
    }

    try:

        headers = {
            "x-ml-key": ML_API_KEY
        }

        response = requests.post(
            BACKEND_ML_URL,
            json=payload,
            headers=headers,
            timeout=30
        )

        response.raise_for_status()

        return {
            "success": True,
            "message": "Data berhasil dikirim ke backend",
            "coordinates": coordinates,
            "backendResponse": response.json()
        }

    except requests.RequestException as e:

        return {
            "success": False,
            "message": f"Gagal menghubungi backend: {str(e)}"
        }


@app.get("/incidents")
def get_incidents():
    """
    Mengambil data kasus kriminal Depok
    yang berhasil di-scrape untuk kebutuhan peta.
    """

    if not INCIDENTS_JSON_PATH.exists():
        return {
            "success": True,
            "count": 0,
            "data": []
        }

    try:

        with open(
            INCIDENTS_JSON_PATH,
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)

        return {
            "success": True,
            "count": len(data),
            "data": data
        }

    except Exception as e:

        return {
            "success": False,
            "message": f"Gagal membaca data: {str(e)}"
        }