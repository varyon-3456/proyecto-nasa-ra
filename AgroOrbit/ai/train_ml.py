
from pathlib import Path
import json

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer


ROOT = Path(__file__).resolve().parents[1]

DATA_FILE = ROOT / "data" / "samples" / "crop_recommendation.csv"
MODEL_DIR = ROOT / "ai" / "models"
MODEL_FILE = MODEL_DIR / "crop_classifier_ml.joblib"
REPORT_FILE = MODEL_DIR / "crop_classifier_ml_report.json"

FEATURES = [
    "N",
    "P",
    "K",
    "temperature",
    "humidity",
    "ph",
    "rainfall",
]

TARGET = "label"


def main():
    print("\n=== AGROORBIT | MACHINE LEARNING ===")

    if not DATA_FILE.exists():
        print(f"ERROR: No se encuentra el archivo:\n{DATA_FILE}")
        return

    data = pd.read_csv(DATA_FILE)

    missing = [
        column for column in FEATURES + [TARGET]
        if column not in data.columns
    ]

    if missing:
        print("ERROR: Faltan columnas:", ", ".join(missing))
        return

    # Convertir las variables de entrada a formato numérico.
    for column in FEATURES:
        data[column] = pd.to_numeric(data[column], errors="coerce")

    data[TARGET] = data[TARGET].astype("string").str.strip()
    data = data.dropna(subset=[TARGET])
    data = data[data[TARGET] != ""]
    data = data.dropna(subset=FEATURES, how="all")

    if len(data) < 100 or data[TARGET].nunique() < 2:
        print(
            "ERROR: El conjunto de datos no tiene suficientes "
            "registros válidos o categorías para esta prueba."
        )
        return

    X = data[FEATURES]
    y = data[TARGET].astype(str)

    # Comprobar que cada clase tiene suficientes ejemplos
    # para aparecer en los conjuntos de entrenamiento y prueba.
    counts = y.value_counts()

    if counts.min() < 2:
        print(
            "ERROR: Alguna categoría tiene menos de dos registros. "
            "Revisa el conjunto de datos antes de entrenar."
        )
        return

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42,
        stratify=y,
    )

    model = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("classifier", RandomForestClassifier(
            n_estimators=200,
            random_state=42,
            class_weight="balanced",
            n_jobs=-1,
        )),
    ])

    print(f"Registros válidos: {len(data)}")
    print(f"Registros de entrenamiento: {len(X_train)}")
    print(f"Registros de prueba: {len(X_test)}")
    print("Entrenando...")

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    report = classification_report(
        y_test,
        predictions,
        output_dict=True,
        zero_division=0,
    )

    print(f"\nExactitud del conjunto de prueba: {accuracy:.4f}")
    print("\nInforme por categoría:")
    print(classification_report(
        y_test,
        predictions,
        zero_division=0,
    ))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    joblib.dump({
        "model": model,
        "features": FEATURES,
        "classes": sorted(y.unique().tolist()),
        "dataset": DATA_FILE.name,
        "warning": (
            "Modelo experimental evaluado con una división aleatoria "
            "del conjunto de datos. No se ha validado en parcelas "
            "independientes ni demuestra generalización a Perú."
        ),
    }, MODEL_FILE)

    report_data = {
        "model": "RandomForestClassifier",
        "dataset": DATA_FILE.name,
        "total_rows": int(len(data)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "accuracy": float(accuracy),
        "classification_report": report,
        "confusion_matrix": confusion_matrix(
            y_test,
            predictions,
            labels=sorted(y.unique()),
        ).tolist(),
        "class_labels": sorted(y.unique().tolist()),
        "features": FEATURES,
        "limitations": [
            "Evaluación inicial con división aleatoria.",
            "La calidad y procedencia del dataset requieren revisión.",
            "No demuestra generalización a otras regiones o parcelas.",
            "No sustituye una evaluación agronómica local.",
        ],
    }

    REPORT_FILE.write_text(
        json.dumps(report_data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"\nModelo guardado: {MODEL_FILE}")
    print(f"Informe guardado: {REPORT_FILE}")
    print("\nEntrenamiento y evaluación inicial completados.")


if __name__ == "__main__":
    main()
