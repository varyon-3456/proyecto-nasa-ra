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

let confirmedLocation = null;

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
        showLocationMessage("Introduce coordenadas válidas.");
        return;
    }

    confirmedLocation = { latitude, longitude };

    latitudeInput.value = latitude;
    longitudeInput.value = longitude;

    showLocationMessage(
        `Ubicación ${source} confirmada: ` +
        `${latitude.toFixed(5)}, ${longitude.toFixed(5)}. ` +
        "Puedes consultar los datos ambientales."
    );

    loadEnvironmentButton.disabled = false;
    environmentStatus.textContent =
        "Ubicación confirmada. Pulsa «Consultar NASA POWER».";
}

gpsButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        showLocationMessage(
            "GPS no disponible en este navegador. " +
            "Introduce las coordenadas manualmente."
        );
        return;
    }

    gpsButton.disabled = true;
    gpsButton.textContent = "Obteniendo ubicación...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            confirmCoordinates(
                position.coords.latitude,
                position.coords.longitude,
                "GPS"
            );

            gpsButton.disabled = false;
            gpsButton.textContent = "Detectar mi ubicación";
        },
        (error) => {
            const messages = {
                1: "Permiso de ubicación denegado.",
                2: "No se pudo determinar la ubicación.",
                3: "La solicitud de ubicación agotó el tiempo."
            };

            showLocationMessage(
                (messages[error.code] || "No se pudo obtener la ubicación.") +
                " Puedes introducir las coordenadas manualmente."
            );

            gpsButton.disabled = false;
            gpsButton.textContent = "Detectar mi ubicación";
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

function formatNumber(value, unit) {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "No disponible";
    }

    return `${value.toFixed(2)}${unit ? ` ${unit}` : ""}`;
}

let lastEnvironmentData = null;

function renderEnvironment(data) {
    lastEnvironmentData = data;
    environmentResults.replaceChildren();

    const fragment = document.createDocumentFragment();

    for (const [code, item] of Object.entries(data.data)) {
        const card = document.createElement("article");
        card.className = "environment-card";

        const title = document.createElement("h3");
        title.textContent = item.label;

        const value = document.createElement("p");
        value.className = "environment-value";
        value.textContent = formatNumber(item.average, item.unit);

        const details = document.createElement("p");
        details.className = "muted";
        details.textContent =
            `${item.available_days} días con datos válidos · ${code}`;

        card.append(title, value, details);
        fragment.appendChild(card);
    }

    environmentResults.appendChild(fragment);

    environmentSource.textContent =
        `Fuente: ${data.source}. ` +
        `Coordenadas: ${data.latitude}, ${data.longitude}. ` +
        `Periodo: ${data.period.start} a ${data.period.end}. ` +
        `Hora de referencia: ${data.period.time_standard}. ` +
        data.notice;
}

async function loadEnvironmentalData() {
    if (!confirmedLocation) {
        environmentStatus.textContent =
            "Primero confirma una ubicación.";
        return;
    }

    loadEnvironmentButton.disabled = true;
    environmentStatus.textContent =
        "Consultando NASA POWER. Esto puede tardar unos segundos.";
    environmentResults.replaceChildren();
    environmentSource.textContent = "";

    const { latitude, longitude } = confirmedLocation;
    const days = Number(periodDays.value);

    const query = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        days: String(days)
    });

    try {
        const response = await fetch(`/api/environment?${query}`);

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `Error HTTP ${response.status}`
            );
        }

        renderEnvironment(result);

        environmentStatus.textContent =
            "Consulta completada. Se muestran los valores devueltos por NASA POWER.";
    } catch (error) {
        environmentStatus.textContent =
            `No se pudieron obtener los datos: ${error.message}. ` +
            "Comprueba Internet e inténtalo nuevamente.";
    } finally {
        loadEnvironmentButton.disabled = false;
    }
}

loadEnvironmentButton.addEventListener(
    "click",
    loadEnvironmentalData
);

async function checkServer() {
    systemStatus.textContent = "Comprobando el servidor...";

    try {
        const response = await fetch("/api/health");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        systemStatus.textContent =
            `${data.application}: servidor ${data.status}. ` +
            "La conexión NASA se comprueba al solicitar datos.";
    } catch {
        systemStatus.textContent =
            "No se pudo conectar con el servidor FastAPI.";
    }
}

checkServerButton.addEventListener("click", checkServer);

checkServer();

// ==========================================
// AGROORBIT: ROTACIÓN DE CULTIVOS
// ==========================================

const currentCropSelect = document.getElementById("current-crop");
const loadRotationButton = document.getElementById("load-rotation");
const rotationStatus = document.getElementById("rotation-status");
const rotationResults = document.getElementById("rotation-results");
const rotationWarning = document.getElementById("rotation-warning");

async function loadCropCatalog() {
    currentCropSelect.disabled = true;
    loadRotationButton.disabled = true;
    rotationStatus.textContent = "Consultando el catálogo de cultivos...";

    try {
        const response = await fetch("/api/crops");
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `Error HTTP ${response.status}`);
        }

        currentCropSelect.replaceChildren();

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Selecciona un cultivo";
        currentCropSelect.appendChild(placeholder);

        for (const crop of result.crops || []) {
            const option = document.createElement("option");
            option.value = crop.id;
            option.textContent = crop.name;
            currentCropSelect.appendChild(option);
        }

        currentCropSelect.disabled = false;
        rotationStatus.textContent =
            "Catálogo cargado. Selecciona el cultivo que tienes sembrado.";

        
        loadRotationButton.disabled = false;
    } catch (error) {
        rotationStatus.textContent =
            `No se pudo cargar el catálogo: ${error.message}. ` +
            "Comprueba que FastAPI esté funcionando.";
    }
}

function createRotationCard(crop) {
    const card = document.createElement("article");
    card.className = "rotation-card";

    const title = document.createElement("h3");
    title.textContent = crop.name;

    const family = document.createElement("p");
    family.className = "muted";
    family.textContent = `Familia botánica: ${crop.family}`;

    const score = document.createElement("p");
    score.className = "rotation-score";
    score.textContent = `Puntaje de reglas: ${crop.score}`;

    const reasonsTitle = document.createElement("p");
    reasonsTitle.textContent = "¿Por qué aparece?";

    const reasonsList = document.createElement("ul");

    for (const reason of crop.reasons || []) {
        const item = document.createElement("li");
        item.textContent = reason;
        reasonsList.appendChild(item);
    }

    const notes = document.createElement("p");
    notes.className = "muted";
    notes.textContent = crop.crop_notes || "";

    card.append(title, family, score, reasonsTitle, reasonsList, notes);
    return card;
}

async function analyzeRotation() {
    const cropId = currentCropSelect.value;

    if (!cropId) {
        rotationStatus.textContent = "Selecciona primero un cultivo.";
        return;
    }

    loadRotationButton.disabled = true;
    rotationResults.replaceChildren();
    rotationWarning.hidden = true;
    rotationWarning.textContent = "";
    rotationStatus.textContent = "Analizando las reglas de rotación...";

    try {
        const query = new URLSearchParams({
            current_crop: cropId
        });

        const response = await fetch(`/api/rotation?${query}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `Error HTTP ${response.status}`);
        }

        // Consultar el contexto ambiental si ya hay una ubicación confirmada.
if (confirmedLocation) {
    try {
        const environmentalQuery = new URLSearchParams({
            latitude: String(confirmedLocation.latitude),
            longitude: String(confirmedLocation.longitude),
            days: String(Number(periodDays.value))
        });

        const environmentalResponse = await fetch(
            `/api/environment?${environmentalQuery}`
        );

        const environmentalData = await environmentalResponse.json();

        if (!environmentalResponse.ok) {
            throw new Error(
                environmentalData.detail ||
                `Error HTTP ${environmentalResponse.status}`
            );
        }

        renderEnvironment(environmentalData);
        environmentStatus.textContent =
            "Datos ambientales consultados durante el análisis de rotación.";
    } catch (error) {
        environmentStatus.textContent =
            `No se pudieron actualizar los datos ambientales: ${error.message}. ` +
            "Las recomendaciones preliminares de rotación siguen disponibles.";
    }
}

        for (const crop of result.recommendations || []) {
            rotationResults.appendChild(createRotationCard(crop));
        }

        rotationStatus.textContent = result.recommendations?.length
            ? `Análisis completado para ${result.current_crop.name}.`
            : "No hay cultivos candidatos en el catálogo.";

const environmentalContext = lastEnvironmentData
    ? [
        "",
        "CONTEXTO AMBIENTAL CONSULTADO",
        `Periodo NASA POWER: ${lastEnvironmentData.period.start} a ${lastEnvironmentData.period.end}`,
        ...Object.values(lastEnvironmentData.data).map((item) =>
            `${item.label}: ${
                item.average === null
                    ? "No disponible"
                    : `${item.average}${item.unit ? ` ${item.unit}` : ""}`
            }`
        ),
        "Estos valores describen el contexto ambiental y no determinan por sí solos qué cultivo sembrar."
    ]
    : [
        "",
        "No hay datos ambientales cargados. Confirma una ubicación y consulta NASA POWER."
    ];

        const warningLines = [
            result.warning,
            `Método: ${result.method}`,
            "Información pendiente de la parcela:",
            ...(result.missing_information || []).map(
                (item) => `• ${item}`
            ),

            ...environmentalContext
        ];

        rotationWarning.textContent = warningLines.join("\n");
        rotationWarning.style.whiteSpace = "pre-line";
        rotationWarning.hidden = false;
    } catch (error) {
        rotationStatus.textContent =
            `No se pudo analizar la rotación: ${error.message}`;
    } finally {
        loadRotationButton.disabled = false;
    }
}

loadRotationButton.addEventListener("click", analyzeRotation);

currentCropSelect.addEventListener("change", () => {
    rotationResults.replaceChildren();
    rotationWarning.hidden = true;
    rotationStatus.textContent = currentCropSelect.value
        ? "Pulsa «Analizar rotación» para ver las alternativas."
        : "Selecciona un cultivo actual.";
});

loadCropCatalog();