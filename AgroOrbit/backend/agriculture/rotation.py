import json
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parents[2]
CATALOG_PATH = PROJECT_DIR / "data" / "crop_catalog.json"
RULES_PATH = PROJECT_DIR / "data" / "rotation_rules.json"


def load_json(path: Path) -> dict:
    """Carga un archivo JSON del proyecto."""
    try:
        with path.open("r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError as exc:
        raise RuntimeError(
            f"No se encontró el archivo requerido: {path}"
        ) from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            f"El archivo JSON contiene errores: {path}"
        ) from exc


def get_crops() -> list:
    """Devuelve los cultivos disponibles en el catálogo."""
    catalog = load_json(CATALOG_PATH)
    return catalog.get("crops", [])


def recommend_rotation(current_crop_id: str) -> dict:
    """
    Ordena cultivos candidatos con reglas transparentes.

    No es un modelo de IA entrenado ni una predicción agronómica.
    """
    catalog = load_json(CATALOG_PATH)
    rules_file = load_json(RULES_PATH)

    crops = catalog.get("crops", [])
    rules = rules_file.get("rules", {})

    current_crop = next(
        (
            crop for crop in crops
            if crop["id"] == current_crop_id
        ),
        None,
    )

    if current_crop is None:
        available = [
            {"id": crop["id"], "name": crop["name"]}
            for crop in crops
        ]
        raise ValueError(
            "Cultivo actual no reconocido. Opciones: "
            + ", ".join(crop["id"] for crop in crops)
        )

    recommendations = []

    for crop in crops:
        # No recomendar el mismo cultivo inmediatamente.
        if crop["id"] == current_crop_id:
            continue

        score = 0
        reasons = []

        # Penalizar la repetición de la misma familia botánica.
        if crop["family"] == current_crop["family"]:
            score -= rules.get("same_family_penalty", 3)
            reasons.append(
                "Pertenece a la misma familia botánica que el cultivo actual."
            )
        else:
            score += 1
            reasons.append(
                "Pertenece a una familia botánica diferente."
            )

        # Considerar leguminosas después de cultivos con alta
        # demanda de nitrógeno como una regla preliminar.
        if (
            current_crop["nitrogen_demand"] == "high"
            and crop["family"] == "Fabaceae"
        ):
            score += rules.get(
                "legume_after_high_nitrogen_demand_bonus", 2
            )
            reasons.append(
                "Es una leguminosa candidata para evaluar en la rotación."
            )

        recommendations.append({
            "id": crop["id"],
            "name": crop["name"],
            "family": crop["family"],
            "score": score,
            "reasons": reasons,
            "crop_notes": crop["notes"],
        })

    recommendations.sort(
        key=lambda item: (-item["score"], item["name"])
    )

    return {
        "current_crop": {
            "id": current_crop["id"],
            "name": current_crop["name"],
            "family": current_crop["family"],
        },
        "recommendations": recommendations,
        "method": "Reglas transparentes; no es un modelo de IA entrenado.",
        "warning": rules_file.get(
            "warning",
            "Verificar las condiciones agrícolas locales.",
        ),
        "missing_information": [
            "Ubicación y altitud de la parcela",
            "Tipo y análisis del suelo",
            "Historial de cultivos y enfermedades",
            "Disponibilidad de agua y fecha de siembra",
        ],
    }