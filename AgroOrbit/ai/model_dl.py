
from pathlib import Path

import torch
from torch import nn


ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "ai" / "models"
MODEL_FILE = MODEL_DIR / "agroorbit_dl_demo.pt"


class AgroOrbitNetwork(nn.Module):
    """Red neuronal pequeña para regresión experimental."""

    def __init__(self, input_features: int = 8):
        super().__init__()

        self.network = nn.Sequential(
            nn.Linear(input_features, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
        )

    def forward(self, x):
        return self.network(x)


def main():
    print("\n=== AGROORBIT | DEEP LEARNING ===")
    print("PyTorch:", torch.__version__)

    # Comprobación técnica de la arquitectura.
    # Estos valores son aleatorios y NO son datos agrícolas reales.
    torch.manual_seed(42)

    model = AgroOrbitNetwork(input_features=8)
    example_input = torch.randn(4, 8)

    predictions = model(example_input)

    print("Entradas de prueba:", tuple(example_input.shape))
    print("Forma de la salida:", tuple(predictions.shape))
    print("Arquitectura creada correctamente.")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "input_features": 8,
            "status": "architecture_demo_not_trained",
        },
        MODEL_FILE,
    )

    print("Arquitectura guardada en:", MODEL_FILE)
    print(
        "AVISO: el modelo todavía no está entrenado. "
        "No usar sus salidas para recomendaciones agrícolas."
    )


if __name__ == "__main__":
    main()
