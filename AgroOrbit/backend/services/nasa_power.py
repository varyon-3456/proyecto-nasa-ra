from datetime import date, timedelta

import httpx


NASA_POWER_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
)

PARAMETERS = [
    "T2M",
    "T2M_MAX",
    "T2M_MIN",
    "PRECTOTCORR",
    "ALLSKY_SFC_SW_DWN",
]

PARAMETER_LABELS = {
    "T2M": "Temperatura media",
    "T2M_MAX": "Temperatura máxima",
    "T2M_MIN": "Temperatura mínima",
    "PRECTOTCORR": "Precipitación corregida",
    "ALLSKY_SFC_SW_DWN": "Radiación solar",
}


class NasaPowerError(Exception):
    """Error controlado al consultar NASA POWER."""


def _clean_value(value):
    """Convierte los valores de NASA en números o None."""
    if value is None:
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if number == -999 or number < -900:
        return None

    return number


async def get_environmental_data(
    latitude: float,
    longitude: float,
    days: int = 30,
) -> dict:
    """
    Consulta datos diarios reales de NASA POWER.

    Se utiliza un periodo que termina hace siete días para
    reducir el riesgo de solicitar datos aún no publicados.
    La disponibilidad real depende de cada parámetro.
    """

    if not -90 <= latitude <= 90:
        raise ValueError("La latitud debe estar entre -90 y 90.")

    if not -180 <= longitude <= 180:
        raise ValueError("La longitud debe estar entre -180 y 180.")

    if not 7 <= days <= 90:
        raise ValueError("El periodo debe estar entre 7 y 90 días.")

    end_date = date.today() - timedelta(days=7)
    start_date = end_date - timedelta(days=days - 1)

    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "JSON",
        "time-standard": "LST",
    }

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.get(
                NASA_POWER_URL,
                params=params,
            )
            response.raise_for_status()
            payload = response.json()

    except httpx.TimeoutException as exc:
        raise NasaPowerError(
            "NASA POWER tardó demasiado en responder. Intenta nuevamente."
        ) from exc

    except httpx.HTTPStatusError as exc:
        raise NasaPowerError(
            f"NASA POWER respondió con HTTP {exc.response.status_code}."
        ) from exc

    except httpx.RequestError as exc:
        raise NasaPowerError(
            "No fue posible conectar con NASA POWER. Comprueba Internet."
        ) from exc

    except ValueError as exc:
        raise NasaPowerError(
            "NASA POWER devolvió una respuesta JSON no válida."
        ) from exc

    if not isinstance(payload, dict):
        raise NasaPowerError("La respuesta de NASA no tiene el formato esperado.")

    properties = payload.get("properties") or {}
    raw_parameters = properties.get("parameter") or {}
    header = payload.get("header") or {}

    if not raw_parameters:
        messages = payload.get("messages") or []
        detail = "; ".join(str(item) for item in messages)

        raise NasaPowerError(
            "NASA POWER no devolvió parámetros ambientales."
            + (f" Detalle: {detail}" if detail else "")
        )

    metadata = header.get("parameters") or {}
    daily_data = {}

    for code in PARAMETERS:
        raw_series = raw_parameters.get(code, {})
        parameter_info = metadata.get(code, {})

        series = []

        for day, raw_value in sorted(raw_series.items()):
            value = _clean_value(raw_value)

            series.append({
                "date": day,
                "value": value,
            })

        valid_values = [
            item["value"]
            for item in series
            if item["value"] is not None
        ]

        daily_data[code] = {
            "label": PARAMETER_LABELS[code],
            "unit": parameter_info.get("units"),
            "description": parameter_info.get("longname"),
            "available_days": len(valid_values),
            "average": (
                round(sum(valid_values) / len(valid_values), 2)
                if valid_values
                else None
            ),
            "daily": series,
        }

    if not any(
        item["available_days"] > 0
        for item in daily_data.values()
    ):
        raise NasaPowerError(
            "La consulta respondió, pero no hay valores válidos "
            "en el periodo solicitado."
        )

    return {
        "source": "NASA POWER",
        "community": "AG",
        "latitude": latitude,
        "longitude": longitude,
        "period": {
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "days_requested": days,
            "time_standard": "LST",
        },
        "retrieved_at": date.today().isoformat(),
        "data": daily_data,
        "notice": (
            "Los datos diarios pueden tener retrasos de publicación. "
            "Los valores representan estimaciones de los productos "
            "ambientales de NASA POWER para su resolución espacial, "
            "no mediciones directas de la parcela."
        ),
    }