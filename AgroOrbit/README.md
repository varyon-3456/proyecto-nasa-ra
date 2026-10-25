# AgroOrbit

Prototipo de agricultura inteligente para analizar condiciones
ambientales y apoyar la rotación de cultivos.

## Tecnologías

- HTML, CSS y JavaScript
- Python y FastAPI
- NASA POWER
- scikit-learn
- PyTorch

## Requisitos

- Python 3.11 o una versión compatible con las dependencias.
- Visual Studio Code.
- Conexión a Internet para las consultas de datos externos.

## Ejecutar en Windows

Activa el entorno virtual e instala las dependencias iniciales:

    python -m pip install fastapi "uvicorn[standard]" httpx

Inicia el servidor desde la raíz del proyecto:

    python -m uvicorn backend.main:app --reload

Abre en el navegador:

    http://127.0.0.1:8000

Documentación interactiva de la API:

    http://127.0.0.1:8000/docs

## Estado actual

- Estructura inicial creada.
- Interfaz base.
- Selección de coordenadas GPS o manual.
- Endpoint de estado del servidor.

La conexión con NASA POWER, el motor de rotación y los modelos
de IA todavía están pendientes de implementación y validación.