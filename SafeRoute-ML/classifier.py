import csv
import pickle
from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score


BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = BASE_DIR / "dataset" / "berita.csv"
REAL_DATASET_PATH = BASE_DIR / "dataset" / "real_training.csv"
MODEL_PATH = BASE_DIR / "models" / "incident_classifier.pkl"


def load_dataset():
    texts = []
    labels = []

    if DATASET_PATH.exists():
        with open(DATASET_PATH, "r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                texts.append(row["text"])
                labels.append(row["label"])
        print(f"Loaded synthetic data: {len(texts)} samples")

    real_count = 0
    if REAL_DATASET_PATH.exists():
        with open(REAL_DATASET_PATH, "r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            for row in reader:
                texts.append(row["text"])
                labels.append(row["label"])
                real_count += 1
        print(f"Loaded real-world data: {real_count} samples")

    return texts, labels


def train_model():
    texts, labels = load_dataset()

    print(f"Jumlah data: {len(texts)}")

    X_train, X_test, y_train, y_test = train_test_split(
        texts,
        labels,
        test_size=0.2,
        random_state=42,
        stratify=labels
    )

    model = Pipeline([
        ("tfidf", TfidfVectorizer(lowercase=True)),
        ("classifier", LogisticRegression(max_iter=1000))
    ])

    param_grid = {
        "tfidf__ngram_range": [(1, 1), (1, 2)],
        "tfidf__max_df": [0.8, 0.9, 1.0],
        "tfidf__min_df": [1, 2],
        "classifier__C": [0.1, 1.0, 10.0]
    }

    print("\nMelakukan Hyperparameter Tuning menggunakan GridSearchCV...")
    grid_search = GridSearchCV(
        model,
        param_grid,
        cv=5,
        n_jobs=-1,
        scoring="accuracy"
    )
    
    grid_search.fit(X_train, y_train)

    best_model = grid_search.best_estimator_
    print(f"Best Parameters: {grid_search.best_params_}")
    print(f"Best Cross-Validation Accuracy: {grid_search.best_score_:.2f}")

    predictions = best_model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)

    print("\n=== HASIL EVALUASI MODEL TERBAIK ===")
    print(f"Accuracy on Test Set: {accuracy:.2f}")

    print("\nClassification Report:")
    print(classification_report(y_test, predictions, zero_division=0))

    MODEL_PATH.parent.mkdir(exist_ok=True)

    with open(MODEL_PATH, "wb") as file:
        pickle.dump(best_model, file)

    print(f"\nModel terbaik berhasil disimpan:")
    print(MODEL_PATH)


def predict(text):
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "Model belum tersedia. Jalankan training terlebih dahulu."
        )

    with open(MODEL_PATH, "rb") as file:
        model = pickle.load(file)

    prediction = model.predict([text])[0]

    probabilities = model.predict_proba([text])[0]
    confidence = max(probabilities)

    return {
        "category": prediction,
        "confidence": round(float(confidence), 4)
    }


if __name__ == "__main__":
    train_model()

    print("\n=== TEST PREDIKSI ===")

    test_text = (
        "Polisi menangkap pelaku begal "
        "yang melakukan aksi di Jalan Margonda."
    )

    result = predict(test_text)

    print(result)