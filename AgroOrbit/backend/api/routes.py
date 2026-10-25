from fastapi import APIRouter, HTTPException, Query

from backend.services.nasa_power import (
    NasaPowerError,
    get_environmental_data,
)

from backend.agriculture.rotation import (
    get_crops,
    recommend_rotation,
)

router = APIRouter(prefix="/api", tags=["AgroOrbit"])


@router.get("/status")
def get_status():
    return {
        "application": "AgroOrbit",
        "status": "ok",
    }


@router.get("/environment")
async def get_environment(
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    days: int = Query(default=30, ge=7, le=90),
):
    try:
        return await get_environmental_data(
            latitude=latitude,
            longitude=longitude,
            days=days,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    except NasaPowerError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc
        
        
        
@router.get("/crops")
def list_crops():
    return {
        "crops": get_crops()
    }


@router.get("/rotation")
def get_rotation(
    current_crop: str = Query(
        ...,
        description="ID del cultivo actual, por ejemplo maiz",
    ),
):
    try:
        return recommend_rotation(current_crop)
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc