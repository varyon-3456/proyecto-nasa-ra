
from pathlib import Path
import json
import random

import numpy as np
import pandas as pd
import torch
from torch import nn
from torch.utils.data import DataLoader, TensorDataset

from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler


ROOT = Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / "data" / "samples" / "crop_recommendation.csv"
MODEL_DIR = ROOT / "ai" / "models"
MODEL_FILE = MODEL_DIR / "crop_classifier_dl.pt"
REPORT_FILE = MODEL_DIR / "crop_classifier_dl_report.json"

FEATURES = [
    "N", "P", "K", "temperature",
    "humidity", "ph", "rainfall",
]
TARGET = "label"
SEED = 42
EPOCHS = 100
BATCH_SIZE = 32


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
    print("\n=== AGROORBIT | DEEP LEARNING ===")

    if not DATA_FILE.exists():
        print(f"ERROR: No se encuentra el archivo: {DATA_FILE}")
        return

    random.seed(SEED)
    np.random.seed(SEED)
    torch.manual_seed(SEED)

    data = pd.read_csv(DATA_FILE)

    missing = [
        column for column in FEATURES + [TARGET]
        if column not in data.columns
    ]

    if missing:
        print("ERROR: Faltan columnas:", ", ".join(missing))
        return

    for column in FEATURES:
        data[column] = pd.to_numeric(data[column], errors="coerce")

    data[TARGET] = data[TARGET].astype("string").str.strip()
    data = data.dropna(subset=FEATURES + [TARGET])
    data = data[data[TARGET] != ""]

    if len(data) < 100 or data[TARGET].nunique() < 2:
        print("ERROR: No hay suficientes datos válidos.")
        return

    X = data[FEATURES].to_numpy(dtype=np.float32)
    labels = data[TARGET].astype(str).to_numpy()

    encoder = LabelEncoder()
    y = encoder.fit_transform(labels)

    counts = pd.Series(y).value_counts()
    if counts.min() < 2:
        print("ERROR: Una categoría tiene menos de dos registros.")
        return

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=SEED,
        stratify=y,
    )

    # Ajustar el escalador SOLO con los datos de entrenamiento.
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train).astype(np.float32)
    X_test = scaler.transform(X_test).astype(np.float32)

    torch_X_train = torch.tensor(X_train, dtype=torch.float32)
    torch_y_train = torch.tensor(y_train, dtype=torch.long)
    torch_X_test = torch.tensor(X_test, dtype=torch.float32)

    dataset = TensorDataset(torch_X_train, torch_y_train)
    generator = torch.Generator().manual_seed(SEED)

    loader = DataLoader(
        dataset,
        batch_size=BATCH_SIZE,
        shuffle=True,
        generator=generator,
    )

    model = CropNetwork(
        input_size=len(FEATURES),
        number_of_classes=len(encoder.classes_),
    )

    loss_function = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=0.001,
        weight_decay=0.0001,
    )

    print(f"Registros válidos: {len(data)}")
    print(f"Entrenamiento: {len(X_train)}")
    print(f"Prueba: {len(X_test)}")
    print(f"Categorías: {len(encoder.classes_)}")
    print("Entrenando la red neuronal...")

    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0.0

        for batch_X, batch_y in loader:
            optimizer.zero_grad()

            logits = model(batch_X)
            loss = loss_function(logits, batch_y)

            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(batch_X)

        if (epoch + 1) % 10 == 0:
            average_loss = total_loss / len(dataset)
            print(
                f"Época {epoch + 1}/{EPOCHS} "
                f"| pérdida: {average_loss:.4f}"
            )

    model.eval()
    with torch.no_grad():
        logits = model(torch_X_test)
        predictions = logits.argmax(dim=1).cpu().numpy()

    accuracy = accuracy_score(y_test, predictions)

    report = classification_report(
        y_test,
        predictions,
        labels=np.arange(len(encoder.classes_)),
        target_names=encoder.classes_,
        output_dict=True,
        zero_division=0,
    )

    print(f"\nExactitud de prueba: {accuracy:.4f}")
    print("\nInforme por categoría:")
    print(classification_report(
        y_test,
        predictions,
        labels=np.arange(len(encoder.classes_)),
        target_names=encoder.classes_,
        zero_division=0,
    ))

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "input_size": len(FEATURES),
            "number_of_classes": len(encoder.classes_),
        },
        MODEL_FILE,
    )

    report_data = {
        "model": "PyTorch CropNetwork",
        "dataset": DATA_FILE.name,
        "seed": SEED,
        "epochs": EPOCHS,
        "total_rows": int(len(data)),
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "accuracy": float(accuracy),
        "features": FEATURES,
        "classes": encoder.classes_.tolist(),
        "scaler_mean": scaler.mean_.tolist(),
        "scaler_scale": scaler.scale_.tolist(),
        "classification_report": report,
        "limitations": [
            "Evaluación inicial con división aleatoria.",
            "La procedencia y calidad del dataset deben verificarse.",
            "No demuestra generalización a parcelas de Perú.",
            "No es una recomendación agrícola validada.",
        ],
    }

    REPORT_FILE.write_text(
        json.dumps(report_data, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"\nModelo guardado: {MODEL_FILE}")
    print(f"Informe guardado: {REPORT_FILE}")
    print("Entrenamiento y evaluación inicial completados.")


if __name__ == "__main__":
    main()
