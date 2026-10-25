
"use strict";

// ==========================================
// AGROORBIT: TRADUCCIONES
// ==========================================

window.agroText = function (spanish, english) {
    return document.documentElement.lang === "en"
        ? english
        : spanish;
};

function T(spanish, english) {
    return window.agroText(spanish, english);
}

// Lee JSON de forma segura, incluso si el servidor devuelve
// una respuesta vacía o un error que no sea JSON.

async function readResponse(response) {
    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error(
            T(
                "El servidor devolvió una respuesta no válida.",
                "The server returned an invalid response."
            )
        );
    }

    if (!response.ok) {
        // No mostramos directamente el detalle del backend,
        // porque podría estar en un idioma diferente.
        const messages = {
            400: T(
                "La solicitud contiene datos incorrectos.",
                "The request contains invalid data."
            ),
            404: T(
                "No se encontró el recurso solicitado.",
                "The requested resource was not found."
            ),
            422: T(
                "Los datos enviados no superan la validación.",
                "The submitted data did not pass validation."
            ),
            500: T(
                "El servidor encontró un error interno.",
                "The server encountered an internal error."
            ),
            502: T(
                "El servicio externo no respondió correctamente.",
                "The external service returned an invalid response."
            ),
            503: T(
                "El servicio no está disponible temporalmente.",
                "The service is temporarily unavailable."
            )
        };

        throw new Error(
            messages[response.status] ||
            T(
                `Ocurrió un error del servidor (HTTP ${response.status}).`,
                `A server error occurred (HTTP ${response.status}).`
            )
        );
    }

    return data;
}


// ==========================================
// AGROORBIT: UBICACIÓN
// ==========================================

const gpsButton = document.getElementById("gps-button");
const locationForm = document.getElementById("location-form");
const latitudeInput = document.getElementById("latitude");
const longitudeInput = document.getElementById("longitude");
const locationResult = document.getElementById("location-result");

const systemStatus = document.getElementById("system-status");
const checkServerButton = document.getElementById("check-server");

const loadEnvironmentButton = document.getElementById("load-environment");
const periodDays = document.getElementById("period-days");
const environmentStatus = document.getElementById("environment-status");
const environmentResults = document.getElementById("environment-results");
const environmentSource = document.getElementById("environment-source");

const currentCropSelect = document.getElementById("current-crop");
const loadRotationButton = document.getElementById("load-rotation");
const rotationStatus = document.getElementById("rotation-status");
const rotationResults = document.getElementById("rotation-results");
const rotationWarning = document.getElementById("rotation-warning");

let confirmedLocation = null;
let lastEnvironmentData = null;

function showLocationMessage(message) {
    locationResult.textContent = message;
}

function validateCoordinates(latitude, longitude) {
    return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}

function confirmCoordinates(latitude, longitude, source) {
    if (!validateCoordinates(latitude, longitude)) {
        showLocationMessage(
            T(
                "Introduce coordenadas válidas: latitud entre -90 y 90 y longitud entre -180 y 180.",
                "Enter valid coordinates: latitude must be between -90 and 90 and longitude between -180 and 180."
            )
        );
        return false;
    }

    confirmedLocation = { latitude, longitude };

    latitudeInput.value = latitude;
    longitudeInput.value = longitude;

    const sourceLabel = source === "GPS"
        ? "GPS"
        : T("manual", "manual");

    showLocationMessage(
        T(
            `Ubicación ${sourceLabel} confirmada: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}. Ya puedes consultar los datos ambientales.`,
            `Location via ${sourceLabel} confirmed: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}. You can now query environmental data.`
        )
    );

    loadEnvironmentButton.disabled = false;

    environmentStatus.textContent = T(
        "Ubicación confirmada. Pulsa «Consultar NASA POWER».",
        "Location confirmed. Click 'Query NASA POWER'."
    );

    return true;
}

gpsButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showLocationMessage(
            T(
                "El GPS no está disponible en este navegador. Introduce las coordenadas manualmente.",
                "GPS is unavailable in this browser. Enter the coordinates manually."
            )
        );
        return;
    }

    gpsButton.disabled = true;
    gpsButton.textContent = T(
        "Obteniendo ubicación...",
        "Getting location..."
    );

    navigator.geolocation.getCurrentPosition(
        (position) => {
            confirmCoordinates(
                position.coords.latitude,
                position.coords.longitude,
                "GPS"
            );

            gpsButton.disabled = false;
            gpsButton.textContent = T(
                "Detectar mi ubicación",
                "Detect my location"
            );
        },
        (error) => {
            const messages = {
                1: T(
                    "Permiso de ubicación denegado.",
                    "Location permission denied."
                ),
                2: T(
                    "No se pudo determinar la ubicación.",
                    "Could not determine the location."
                ),
                3: T(
                    "La solicitud de ubicación agotó el tiempo.",
                    "The location request timed out."
                )
            };

            showLocationMessage(
                (messages[error.code] || T(
                    "No se pudo obtener la ubicación.",
                    "Could not obtain the location."
                )) +
                " " +
                T(
                    "Puedes introducir las coordenadas manualmente.",
                    "You can enter the coordinates manually."
                )
            );

            gpsButton.disabled = false;
            gpsButton.textContent = T(
                "Detectar mi ubicación",
                "Detect my location"
            );
        },
        {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000
        }
    );
});

locationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const latitude = Number(latitudeInput.value);
    const longitude = Number(longitudeInput.value);

    confirmCoordinates(latitude, longitude, "manual");
});

// ==========================================
// AGROORBIT: DATOS AMBIENTALES NASA POWER
// ==========================================

function formatNumber(value, unit) {
    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(Number(value))
    ) {
        return T("No disponible", "Unavailable");
    }

    return `${Number(value).toFixed(2)}${unit ? ` ${unit}` : ""}`;
}

function renderEnvironment(data) {
    if (
        !data ||
        !data.data ||
        typeof data.data !== "object" ||
        !data.period
    ) {
        throw new Error(
            T(
                "La respuesta ambiental no tiene el formato esperado.",
                "The environmental response has an unexpected format."
            )
        );
    }

    lastEnvironmentData = data;
    environmentResults.replaceChildren();

    const fragment = document.createDocumentFragment();

    for (const [code, item] of Object.entries(data.data)) {
        const card = document.createElement("article");
        card.className = "environment-card";

        const title = document.createElement("h3");
        title.textContent = item.label || code;

        const value = document.createElement("p");
        value.className = "environment-value";
        value.textContent = formatNumber(item.average, item.unit);

        const details = document.createElement("p");
        details.className = "muted";

        const days = Number(item.available_days);
        const daysText = Number.isFinite(days) ? days : 0;

        details.textContent = T(
            `${daysText} días con datos válidos · ${code}`,
            `${daysText} days with valid data · ${code}`
        );

        card.append(title, value, details);
        fragment.appendChild(card);
    }

    environmentResults.appendChild(fragment);

    environmentSource.textContent = [
        T("Fuente", "Source") + `: ${data.source || "NASA POWER"}.`,
        T("Coordenadas", "Coordinates") +
            `: ${data.latitude}, ${data.longitude}.`,
        T("Periodo", "Period") +
            `: ${data.period.start} – ${data.period.end}.`,
        T("Hora de referencia", "Reference time") +
            `: ${data.period.time_standard || "—"}.`,
        data.notice || ""
    ].filter(Boolean).join(" ");
}

async function fetchEnvironmentalData() {
    if (!confirmedLocation) {
        throw new Error(
            T(
                "Primero confirma una ubicación.",
                "Confirm a location first."
            )
        );
    }

    const days = Number(periodDays.value);

    if (![7, 30, 90].includes(days)) {
        throw new Error(
            T(
                "Selecciona un periodo válido.",
                "Select a valid period."
            )
        );
    }

    const query = new URLSearchParams({
        latitude: String(confirmedLocation.latitude),
        longitude: String(confirmedLocation.longitude),
        days: String(days)
    });

    const response = await fetch(`/api/environment?${query}`);
    return readResponse(response);
}

async function loadEnvironmentalData() {
    if (!confirmedLocation) {
        environmentStatus.textContent = T(
            "Primero confirma una ubicación.",
            "Confirm a location first."
        );
        return;
    }

    loadEnvironmentButton.disabled = true;

    environmentStatus.textContent = T(
        "Consultando NASA POWER. Esto puede tardar unos segundos.",
        "Querying NASA POWER. This may take a few seconds."
    );

    environmentResults.replaceChildren();
    environmentSource.textContent = "";

    try {
        const result = await fetchEnvironmentalData();

        renderEnvironment(result);

        environmentStatus.textContent = T(
            "Consulta completada. Se muestran los valores devueltos por NASA POWER.",
            "Query completed. Showing the values returned by NASA POWER."
        );
    } catch (error) {
        environmentStatus.textContent = T(
            `No se pudieron obtener los datos: ${error.message}. Comprueba tu conexión e inténtalo nuevamente.`,
            `Could not retrieve the data: ${error.message}. Check your connection and try again.`
        );
    } finally {
        loadEnvironmentButton.disabled = false;
    }
}

loadEnvironmentButton.addEventListener(
    "click",
    loadEnvironmentalData
);

// ==========================================
// AGROORBIT: ESTADO DEL SERVIDOR
// ==========================================

async function checkServer() {
    checkServerButton.disabled = true;

    systemStatus.textContent = T(
        "Comprobando el servidor...",
        "Checking server..."
    );

    try {
        const response = await fetch("/api/health");
        const data = await readResponse(response);

        systemStatus.textContent = T(
            `${data.application || "AgroOrbit"}: servidor ${data.status || "disponible"}. La conexión NASA se comprueba al solicitar datos.`,
            `${data.application || "AgroOrbit"}: server ${data.status || "available"}. The NASA connection is checked when data is requested.`
        );
    } catch (error) {
        systemStatus.textContent = T(
            `No se pudo comprobar el servidor FastAPI: ${error.message}`,
            `Could not check the FastAPI server: ${error.message}`
        );
    } finally {
        checkServerButton.disabled = false;
    }
}

checkServerButton.addEventListener("click", checkServer);
checkServer();

// ==========================================
// AGROORBIT: CATÁLOGO DE CULTIVOS
// ==========================================

async function loadCropCatalog() {
    currentCropSelect.disabled = true;
    loadRotationButton.disabled = true;

    rotationStatus.textContent = T(
        "Consultando el catálogo de cultivos...",
        "Loading the crop catalog..."
    );

    try {
        const response = await fetch("/api/crops");
        const result = await readResponse(response);

        if (!Array.isArray(result.crops)) {
            throw new Error(
                T(
                    "El catálogo recibido no tiene el formato esperado.",
                    "The received catalog has an unexpected format."
                )
            );
        }

        currentCropSelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = T(
            "Selecciona un cultivo",
            "Select a crop"
        );

        currentCropSelect.appendChild(placeholder);

        for (const crop of result.crops) {
            if (!crop || crop.id === undefined || !crop.name) {
                continue;
            }

            const option = document.createElement("option");
            option.value = crop.id;
            option.textContent = crop.name;

            currentCropSelect.appendChild(option);
        }

        currentCropSelect.disabled = false;
        loadRotationButton.disabled = false;

        rotationStatus.textContent = T(
            "Catálogo cargado. Selecciona el cultivo que tienes sembrado.",
            "Catalog loaded. Select the crop currently planted."
        );
    } catch (error) {
        currentCropSelect.disabled = true;

        rotationStatus.textContent = T(
            `No se pudo cargar el catálogo: ${error.message}. Comprueba que FastAPI esté funcionando.`,
            `Could not load the catalog: ${error.message}. Check that FastAPI is running.`
        );
    }
}

// ==========================================
// AGROORBIT: TARJETAS DE ROTACIÓN
// ==========================================

function createRotationCard(crop) {
    const card = document.createElement("article");
    card.className = "rotation-card";

    const title = document.createElement("h3");
    title.textContent = crop.name || T("Cultivo", "Crop");

    const family = document.createElement("p");
    family.className = "muted";
    family.textContent = T(
        `Familia botánica: ${crop.family || "No especificada"}`,
        `Botanical family: ${crop.family || "Not specified"}`
    );

    const score = document.createElement("p");
    score.className = "rotation-score";
    score.textContent = T(
        `Puntaje de reglas: ${crop.score ?? "No disponible"}`,
        `Rule score: ${crop.score ?? "Unavailable"}`
    );

    const reasonsTitle = document.createElement("p");
    reasonsTitle.textContent = T(
        "¿Por qué aparece?",
        "Why is this crop suggested?"
    );

    const reasonsList = document.createElement("ul");

    for (const reason of crop.reasons || []) {
        const item = document.createElement("li");
        item.textContent = String(reason);
        reasonsList.appendChild(item);
    }

    const notes = document.createElement("p");
    notes.className = "muted";
    notes.textContent = crop.crop_notes || "";

    card.append(
        title,
        family,
        score,
        reasonsTitle,
        reasonsList,
        notes
    );

    return card;
}

// ==========================================
// AGROORBIT: ANÁLISIS DE ROTACIÓN
// ==========================================

async function analyzeRotation() {
    const cropId = currentCropSelect.value;

    if (!cropId) {
        rotationStatus.textContent = T(
            "Selecciona primero un cultivo.",
            "Select a crop first."
        );
        return;
    }

    loadRotationButton.disabled = true;
    rotationResults.replaceChildren();
    rotationWarning.hidden = true;
    rotationWarning.textContent = "";

    rotationStatus.textContent = T(
        "Analizando las reglas de rotación...",
        "Analyzing the crop rotation rules..."
    );

    try {
        const query = new URLSearchParams({
            current_crop: cropId
        });

        const response = await fetch(`/api/rotation?${query}`);
        const result = await readResponse(response);

        // Consultar NASA POWER si ya se confirmó una ubicación.
        // Si falla la consulta ambiental, el análisis de rotación
        // todavía puede mostrarse como resultado preliminar.
        if (confirmedLocation) {
            try {
                const environmentalData =
                    await fetchEnvironmentalData();

                renderEnvironment(environmentalData);

                environmentStatus.textContent = T(
                    "Datos ambientales consultados durante el análisis de rotación.",
                    "Environmental data retrieved during the rotation analysis."
                );
            } catch (error) {
                environmentStatus.textContent = T(
                    `No se pudieron actualizar los datos ambientales: ${error.message}. Las alternativas preliminares siguen disponibles.`,
                    `Could not update environmental data: ${error.message}. Preliminary alternatives are still available.`
                );
            }
        }

        const recommendations = Array.isArray(result.recommendations)
            ? result.recommendations
            : [];

        for (const crop of recommendations) {
            if (crop && typeof crop === "object") {
                rotationResults.appendChild(createRotationCard(crop));
            }
        }

        const currentCropName =
            result.current_crop?.name || cropId;

        rotationStatus.textContent = recommendations.length
            ? T(
                `Análisis completado para ${currentCropName}.`,
                `Analysis completed for ${currentCropName}.`
            )
            : T(
                "No hay cultivos candidatos en el catálogo.",
                "There are no candidate crops in the catalog."
            );

        const environmentalContext = lastEnvironmentData
            ? [
                "",
                T(
                    "CONTEXTO AMBIENTAL CONSULTADO",
                    "ENVIRONMENTAL CONTEXT"
                ),
                `${T("Periodo NASA POWER", "NASA POWER period")}: ${lastEnvironmentData.period.start} – ${lastEnvironmentData.period.end}`,
                ...Object.entries(lastEnvironmentData.data || {}).map(
                    ([code, item]) => {
                        const value = item.average === null ||
                            item.average === undefined
                            ? T("No disponible", "Unavailable")
                            : formatNumber(item.average, item.unit);

                        return `${item.label || code}: ${value}`;
                    }
                ),
                T(
                    "Estos valores describen el contexto ambiental y no determinan por sí solos qué cultivo sembrar.",
                    "These values describe environmental conditions and do not, by themselves, determine which crop should be planted."
                )
            ]
            : [
                "",
                T(
                    "No hay datos ambientales cargados. Confirma una ubicación y consulta NASA POWER.",
                    "No environmental data is loaded. Confirm a location and query NASA POWER."
                )
            ];

        const warningLines = [
            result.warning || "",
            result.method
                ? `${T("Método", "Method")}: ${result.method}`
                : "",
            T(
                "Información pendiente de la parcela:",
                "Missing field information:"
            ),
            ...(result.missing_information || []).map(
                (item) => `• ${item}`
            ),
            ...environmentalContext
        ].filter((line) => line !== "");

        rotationWarning.textContent = warningLines.join("\n");
        rotationWarning.style.whiteSpace = "pre-line";
        rotationWarning.hidden = false;

    } catch (error) {
        rotationStatus.textContent = T(
            `No se pudo analizar la rotación: ${error.message}`,
            `Could not analyze crop rotation: ${error.message}`
        );
    } finally {
        loadRotationButton.disabled = false;
    }
}

loadRotationButton.addEventListener("click", analyzeRotation);

currentCropSelect.addEventListener("change", () => {
    rotationResults.replaceChildren();
    rotationWarning.hidden = true;
    rotationWarning.textContent = "";

    rotationStatus.textContent = currentCropSelect.value
        ? T(
            "Pulsa «Analizar rotación» para ver las alternativas.",
            "Click 'Analyze rotation' to see the alternatives."
        )
        : T(
            "Selecciona un cultivo actual.",
            "Select the current crop."
        );
});

// ==========================================
// INICIALIZACIÓN
// ==========================================

loadCropCatalog();
