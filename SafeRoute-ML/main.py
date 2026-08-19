from pathlib import Path

# pyrefly: ignore [missing-import]
import spacy
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

from classifier import predict


BASE_DIR = Path(__file__).resolve().parent
NER_MODEL_PATH = BASE_DIR / "models" / "saferoute_ner"
INCIDENTS_JSON_PATH = BASE_DIR / "dataset" / "scraped_real_cases.json"

ner_model = spacy.load(NER_MODEL_PATH)


app = FastAPI(
    title="SafeRoute ML Service",
    description="Machine Learning service untuk SafeRoute",
    version="1.0.0"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Izinkan semua origin untuk development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str


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

    # =========================
    # CLASSIFICATION
    # =========================

    classification = predict(text)

    # =========================
    # NER
    # =========================

    doc = ner_model(text)

    locations = []
    times = []

    for entity in doc.ents:

        if entity.label_ == "LOCATION":
            locations.append(entity.text)

        elif entity.label_ == "TIME":
            times.append(entity.text)

    # =========================
    # RESPONSE
    # =========================

    return {
        "success": True,
        "data": {
            "category": classification["category"],
            "confidence": classification["confidence"],
            "locations": locations,
            "times": times
        }
    }


@app.get("/incidents")
def get_incidents():
    """
    Mengambil data kasus kriminal Depok yang berhasil di-scrape untuk kebutuhan peta
    """
    import json
    if not INCIDENTS_JSON_PATH.exists():
        return {
            "success": True,
            "count": 0,
            "data": []
        }
    
    try:
        with open(INCIDENTS_JSON_PATH, "r", encoding="utf-8") as f:
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