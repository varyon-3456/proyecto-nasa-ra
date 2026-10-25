"""
La ubicación GPS se obtiene en el navegador.
Este módulo se utilizará para validar coordenadas y,
posteriormente, integrar la búsqueda de lugares.
"""


def validate_coordinates(latitude: float, longitude: float) -> bool:
    return (
        -90 <= latitude <= 90
        and -180 <= longitude <= 180
    )