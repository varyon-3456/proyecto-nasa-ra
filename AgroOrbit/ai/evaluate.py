
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = ROOT / "ai" / "models"

REPORTS = {
    "Machine Learning (Random Forest)": (
        MODEL_DIR / "crop_classifier_ml_report.json"
    ),
    "Deep Learning (Red neuronal)": (
        MODEL_DIR / "crop_classifier_dl_report.json"
    ),
}


def load_metrics(name, path):
    if not path.exists():
        print(f"\nNo se encontró el informe: {path.name}")
        return None

    with path.open("r", encoding="utf-8") as file:
        report = json.load(file)

    classification = report.get("classification_report", {})
    macro = classification.get("macro avg", {})

    accuracy = report.get("accuracy")
    f1 = macro.get("f1-score")
    precision = macro.get("precision")
    recall = macro.get("recall")

    return {
        "name": name,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "test_rows": report.get("test_rows"),
    }


def percentage(value):
    if value is None:
        return "No disponible"
    return f"{value * 100:.2f}%"


def main():
    print("\n========================================")
    print("       AGROORBIT - COMPARADOR DE IA")
    print("========================================")

    results = []

    for name, path in REPORTS.items():
        try:
            result = load_metrics(name, path)
            if result is not None:
                results.append(result)
        except (OSError, json.JSONDecodeError) as error:
            print(f"\nError leyendo {path.name}: {error}")

    if not results:
        print("\nNo hay informes para comparar.")
        print("Ejecuta primero los entrenamientos ML y DL.")
        return

    for result in results:
        print(f"\nModelo: {result['name']}")
        print(f"Exactitud:       {percentage(result['accuracy'])}")
        print(f"Precisión macro: {percentage(result['precision'])}")
        print(f"Recall macro:    {percentage(result['recall'])}")
        print(f"F1 macro:        {percentage(result['f1'])}")
        print(f"Muestras de prueba: {result['test_rows'] or 'No disponible'}")

    comparable = [
        result for result in results
        if result["accuracy"] is not None
        and result["f1"] is not None
    ]

    if len(comparable) >= 2:
        best = max(comparable, key=lambda result: result["f1"])
        print("\n----------------------------------------")
        print(f"Mayor F1 macro en esta prueba: {best['name']}")
        print("----------------------------------------")
        print(
            "Esto no demuestra que sea el mejor modelo "
            "para parcelas reales."
        )
    else:
        print("\nFaltan métricas para comparar ambos modelos.")

    print("\nLimitación: el dataset debe verificarse y")
    print("la evaluación debe repetirse con datos representativos.")
    print("La comparación no valida recomendaciones agrícolas.")


if __name__ == "__main__":
    main()
