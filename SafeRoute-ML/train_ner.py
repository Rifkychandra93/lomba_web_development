# pyrefly: ignore [missing-import]
import spacy
# pyrefly: ignore [missing-import]
from spacy.training.example import Example
import json
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "ner_dataset" / "ner_data.json"
MODEL_OUTPUT_DIR = BASE_DIR / "models" / "saferoute_ner"

def load_data():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    formatted_data = []
    for item in data:
        entities = []
        for ent in item.get("entities", []):
            entities.append((ent["start"], ent["end"], ent["label"]))
        formatted_data.append((item["text"], {"entities": entities}))
    return formatted_data

def train_ner_model(training_data, iterations=30):
    print("Mulai melatih model NER...")
    # Gunakan model blank bahasa Indonesia
    nlp = spacy.blank("id")
    
    if "ner" not in nlp.pipe_names:
        ner = nlp.add_pipe("ner", last=True)
    else:
        ner = nlp.get_pipe("ner")
    
    # Tambahkan label
    for _, annotations in training_data:
        for ent in annotations.get("entities"):
            ner.add_label(ent[2])
            
    other_pipes = [pipe for pipe in nlp.pipe_names if pipe != "ner"]
    with nlp.disable_pipes(*other_pipes):
        optimizer = nlp.begin_training()
        for itn in range(iterations):
            random.shuffle(training_data)
            losses = {}
            for batch in spacy.util.minibatch(training_data, size=8):
                for text, annotations in batch:
                    doc = nlp.make_doc(text)
                    example = Example.from_dict(doc, annotations)
                    nlp.update(
                        [example],
                        drop=0.5,
                        sgd=optimizer,
                        losses=losses,
                    )
            print(f"Iterasi {itn + 1}, Loss: {losses.get('ner', 0):.4f}")
            
    MODEL_OUTPUT_DIR.parent.mkdir(exist_ok=True, parents=True)
    nlp.to_disk(MODEL_OUTPUT_DIR)
    print(f"\nModel NER berhasil dilatih dan disimpan di: {MODEL_OUTPUT_DIR}")

if __name__ == "__main__":
    if not DATA_PATH.exists():
        print(f"File data {DATA_PATH} tidak ditemukan.")
        print("Jalankan ner_dataset/generate_ner_dataset.py terlebih dahulu.")
    else:
        train_data = load_data()
        print(f"Jumlah data training: {len(train_data)}")
        train_ner_model(train_data, iterations=20)
