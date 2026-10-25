from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.api.routes import router

from backend.api.ai_routes import router as ai_router

PROJECT_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_DIR / "frontend"

app = FastAPI(
    title="AgroOrbit API",
    description=(
        "Agricultura inteligente con datos ambientales "
        "de NASA POWER."
    ),
    version="0.2.0",
)

app.include_router(router)
app.include_router(ai_router)

app.mount(
    "/css",
    StaticFiles(directory=str(FRONTEND_DIR / "css")),
    name="css",
)

app.mount(
    "/js",
    StaticFiles(directory=str(FRONTEND_DIR / "js")),
    name="javascript",
)


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/api/health", tags=["Sistema"])
def health():
    return {
        "application": "AgroOrbit",
        "status": "ok",
        "version": "0.2.0",
        "nasa_connected": "not_checked",
        "ai_ready": True,
        "message": (
            "Servidor activo. La conexión con NASA POWER "
            "se comprueba al solicitar datos ambientales."
        ),
    }