
import math

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.ai_prediction import predict_crops

router = APIRouter(prefix="/api/ai", tags=["AgroOrbit AI"])


class CropPredictionInput(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


@router.post("/predict")
def predict(data: CropPredictionInput):
    values = data.model_dump()

    if not all(math.isfinite(value) for value in values.values()):
        raise HTTPException(
            status_code=422,
            detail="Todos los valores deben ser números finitos.",
        )

    try:
        return predict_crops(values)
    except (ValueError, FileNotFoundError) as error:
        raise HTTPException(
            status_code=500,
            detail=f"No se pudo ejecutar la predicción: {error}",
        ) from error
