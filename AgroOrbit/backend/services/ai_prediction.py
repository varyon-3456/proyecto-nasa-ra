
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
import torch
from torch import nn


ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = ROOT / "ai" / "models"

ML_FILE = MODEL_DIR / "crop_classifier_ml.joblib"
DL_FILE = MODEL_DIR / "crop_classifier_dl.pt"
DL_REPORT = MODEL_DIR / "crop_classifier_dl_report.json"

FEATURES = [
    "N", "P", "K", "temperature",
    "humidity", "ph", "rainfall",
]


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


_ml_bundle = None
_dl_model = None
_dl_report = None


def load_models():
    """Carga los modelos una vez y los reutiliza en siguientes consultas."""
    global _ml_bundle, _dl_model, _dl_report

    if _ml_bundle is not None and _dl_model is not None:
        return

    for path in [ML_FILE, DL_FILE, DL_REPORT]:
        if not path.exists():
            raise FileNotFoundError(
                f"No se encuentra el archivo del modelo: {path}"
            )

    bundle = joblib.load(ML_FILE)

    if not isinstance(bundle, dict) or "model" not in bundle:
        raise ValueError("El archivo ML no contiene la clave 'model'.")

    ml_features = bundle.get("features", FEATURES)
    if list(ml_features) != FEATURES:
        raise ValueError(
            "Las características del modelo ML no coinciden con las esperadas."
        )

    with DL_REPORT.open("r", encoding="utf-8") as file:
        report = json.load(file)

    classes = report["classes"]
    checkpoint = torch.load(
        DL_FILE,
        map_location="cpu",
        weights_only=True,
    )

    if (
        checkpoint["input_size"] != len(FEATURES)
        or checkpoint["number_of_classes"] != len(classes)
    ):
        raise ValueError("La arquitectura DL no coincide con su informe.")

    model = CropNetwork(
        checkpoint["input_size"],
        checkpoint["number_of_classes"],
    )
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    _ml_bundle = bundle
    _dl_model = model
    _dl_report = report


def predict_crops(values):
    """
    values debe contener N, P, K, temperature, humidity, ph y rainfall.
    Devuelve predicciones experimentales de ML y DL.
    """
    load_models()

    missing = [name for name in FEATURES if name not in values]
    if missing:
        raise ValueError(
            "Faltan variables obligatorias: " + ", ".join(missing)
        )

    try:
        row = {name: float(values[name]) for name in FEATURES}
    except (TypeError, ValueError) as error:
        raise ValueError("Todas las variables deben ser numéricas.") from error

    if not all(np.isfinite(value) for value in row.values()):
        raise ValueError("Las variables deben ser números finitos.")

    ml_input = pd.DataFrame([row], columns=FEATURES)
    ml_model = _ml_bundle["model"]
    ml_class = str(ml_model.predict(ml_input)[0])

    ml_confidence = None
    if hasattr(ml_model, "predict_proba"):
        ml_probabilities = ml_model.predict_proba(ml_input)[0]
        ml_confidence = float(np.max(ml_probabilities))

    report = _dl_report
    mean = np.asarray(report["scaler_mean"], dtype=np.float32)
    scale = np.asarray(report["scaler_scale"], dtype=np.float32)

    if len(mean) != len(FEATURES) or len(scale) != len(FEATURES):
        raise ValueError("El escalado DL no tiene las dimensiones esperadas.")
    if np.any(scale == 0):
        raise ValueError("El escalado DL contiene un valor cero.")

    raw = np.asarray([[row[name] for name in FEATURES]], dtype=np.float32)
    scaled = (raw - mean) / scale

    with torch.no_grad():
        tensor = torch.tensor(scaled, dtype=torch.float32)
        probabilities = torch.softmax(_dl_model(tensor), dim=1)[0]
        index = int(torch.argmax(probabilities).item())

    dl_class = str(report["classes"][index])
    dl_confidence = float(probabilities[index].item())

    return {
        "machine_learning": {
            "crop": ml_class,
            "model_probability": ml_confidence,
        },
        "deep_learning": {
            "crop": dl_class,
            "model_probability": dl_confidence,
        },
        "models_agree": ml_class == dl_class,
        "experimental": True,
        "warning": (
            "Resultado experimental basado en un dataset cuya "
            "representatividad para parcelas peruanas debe verificarse. "
            "No constituye una recomendación agronómica validada."
        ),
    }
