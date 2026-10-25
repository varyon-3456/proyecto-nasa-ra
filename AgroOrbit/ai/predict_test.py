import pandas as pd
from pathlib import Path
import json

import joblib
import numpy as np
import torch
from torch import nn

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "ai" / "models"

ML_FILE = MODEL_DIR / "crop_classifier_ml.joblib"
DL_FILE = MODEL_DIR / "crop_classifier_dl.pt"
ML_REPORT = MODEL_DIR / "crop_classifier_ml_report.json"
DL_REPORT = MODEL_DIR / "crop_classifier_dl_report.json"

FEATURES = [
    "N", "P", "K", "temperature",
    "humidity", "ph", "rainfall",
]

# Datos de demostración; no representan una parcela real.
SAMPLE = {
    "N": 90,
    "P": 42,
    "K": 43,
    "temperature": 20.9,
    "humidity": 82.0,
    "ph": 6.5,
    "rainfall": 202.0,
}


class CropNetwork(nn.Module):
    def __init__(self, input_size, number_of_classes):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_size, 64),
            nn.ReLU(),
            nn.Dropout(0.15),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, number_of_classes),
        )

    def forward(self, x):
        return self.network(x)


def main():
    print("\n=== AGROORBIT | PRUEBA DE PREDICCIÓN ===")

    required = [ML_FILE, DL_FILE, ML_REPORT, DL_REPORT]
    for path in required:
        if not path.exists():
            print(f"ERROR: Falta el archivo: {path}")
            return

    print("\nVariables de demostración:")
    for name, value in SAMPLE.items():
        print(f"  {name}: {value}")

    # Machine Learning
    print("\n--- MACHINE LEARNING ---")
    ml_bundle = joblib.load(ML_FILE)

    if not isinstance(ml_bundle, dict) or "model" not in ml_bundle:
        print("ERROR: El archivo ML no contiene la clave 'model'.")
        return

    ml_model = ml_bundle["model"]
    ml_features = ml_bundle.get("features", FEATURES)

    if list(ml_features) != FEATURES:
        print("ERROR: Las características del modelo ML no coinciden.")
        print("Características guardadas:", ml_features)
        return

    ml_input = pd.DataFrame(
    [[SAMPLE[name] for name in FEATURES]],
    columns=FEATURES,
)

    ml_prediction = str(ml_model.predict(ml_input)[0])
    print(f"Predicción ML: {ml_prediction}")

    if hasattr(ml_model, "predict_proba"):
        probabilities = ml_model.predict_proba(ml_input)[0]
        print(
            "Probabilidad máxima ML: "
            f"{float(np.max(probabilities)) * 100:.2f}%"
        )

    # Deep Learning
    print("\n--- DEEP LEARNING ---")
    with DL_REPORT.open("r", encoding="utf-8") as file:
        dl_report = json.load(file)

    classes = dl_report["classes"]
    scaler_mean = np.asarray(
        dl_report["scaler_mean"], dtype=np.float32
    )
    scaler_scale = np.asarray(
        dl_report["scaler_scale"], dtype=np.float32
    )

    if (
        len(classes) == 0
        or len(scaler_mean) != len(FEATURES)
        or len(scaler_scale) != len(FEATURES)
        or np.any(scaler_scale == 0)
    ):
        print("ERROR: Escalado o clases DL no válidos.")
        return

    checkpoint = torch.load(
        DL_FILE, map_location="cpu", weights_only=True
    )

    if (
        checkpoint["input_size"] != len(FEATURES)
        or checkpoint["number_of_classes"] != len(classes)
    ):
        print("ERROR: La arquitectura DL no coincide con el informe.")
        return

    model = CropNetwork(
        checkpoint["input_size"],
        checkpoint["number_of_classes"],
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    raw = np.array(
        [[SAMPLE[name] for name in FEATURES]],
        dtype=np.float32,
    )
    scaled = (raw - scaler_mean) / scaler_scale

    with torch.no_grad():
        logits = model(torch.tensor(scaled, dtype=torch.float32))
        probs = torch.softmax(logits, dim=1)[0]
        index = int(torch.argmax(probs).item())

    dl_prediction = str(classes[index])
    print(f"Predicción DL: {dl_prediction}")
    print(
        "Probabilidad máxima DL: "
        f"{float(probs[index]) * 100:.2f}%"
    )

    print("\n--- COMPARACIÓN ---")
    if ml_prediction == dl_prediction:
        print("Ambos modelos predicen la misma categoría.")
    else:
        print("Los modelos predicen categorías diferentes.")

    print(
        "\nAVISO: las probabilidades del modelo no garantizan "
        "que la predicción sea correcta en una parcela real."
    )
    print(
        "Los valores de entrada son demostrativos, no "
        "una recomendación agrícola validada."
    )


if __name__ == "__main__":
    main()
