
"use strict";

const translations = {
    es: {
        step1: "PASO 01",
        step2: "PASO 02",
        step3: "PASO 03",
        step4: "PASO 04",
        checkingServer: "Comprobando el servidor...",
        pageTitle: "AgroOrbit | Agricultura inteligente",
        brandSubtitle: "Agricultura inteligente",
        prototype: "Prototipo funcional",

        eyebrow: "AGRICULTURA BASADA EN DATOS",
        heroTitle: "Cultiva con inteligencia.",
        heroTitleSecond: "Decide con evidencia.",
        heroDescription:
            "Analiza las condiciones ambientales de tu ubicación y prepara decisiones de rotación de cultivos.",

        locationTitle: "Ubicación agrícola",
        locationDescription:
            "Usa tu ubicación actual o introduce las coordenadas de la parcela que deseas analizar.",
        detectLocation: "Detectar mi ubicación",
        manualCoordinates: "O introduce las coordenadas manualmente",
        latitude: "Latitud",
        longitude: "Longitud",
        confirmLocation: "Confirmar ubicación",
        noLocation: "Aún no se ha confirmado ninguna ubicación.",

        environmentTitle: "Datos ambientales",
        environmentDescription:
            "Consulta las variables ambientales de las coordenadas confirmadas.",
        period: "Periodo de consulta",
        last7Days: "Últimos 7 días disponibles",
        last30Days: "Últimos 30 días disponibles",
        last90Days: "Últimos 90 días disponibles",
        queryNasa: "Consultar NASA POWER",
        confirmLocationFirst: "Primero confirma una ubicación.",

        rotationTitle: "Rotación inteligente de cultivos",
        rotationDescription:
            "Selecciona el cultivo actual para consultar alternativas calculadas por las reglas de AgroOrbit.",
        currentCrop: "Cultivo actual",
        loadingCrops: "Cargando cultivos disponibles...",
        analyzeRotation: "Analizar rotación",

        aiTitle: "Predicción inteligente de cultivos",
        aiDescription:
            "Introduce los datos de la parcela para comparar las predicciones de los modelos de Machine Learning y Deep Learning.",
        nitrogen: "Nitrógeno (N)",
        phosphorus: "Fósforo (P)",
        potassium: "Potasio (K)",
        temperature: "Temperatura (°C)",
        humidity: "Humedad (%)",
        soilPh: "pH del suelo",
        rainfall: "Lluvia (mm)",
        demoValues:
            "Introduce mediciones de la parcela cuando estén disponibles. Los valores iniciales son únicamente de demostración.",
        predictCrop: "Predecir cultivo",
        readyPrediction: "Listo para realizar una predicción experimental.",

        featureEnvironment: "Datos ambientales",
        environmentFeatureDescription:
            "Consulta de temperatura, precipitación y radiación solar mediante NASA POWER.",
        nasaIntegrated: "Consulta NASA POWER integrada",

        featureRotation: "Rotación de cultivos",
        rotationFeatureDescription:
            "Análisis de alternativas mediante las reglas de rotación implementadas en AgroOrbit.",
        rulesIntegrated: "Motor de reglas integrado",

        featureAI: "Inteligencia artificial",
        aiFeatureDescription:
            "Comparación de resultados experimentales de los modelos de Machine Learning y Deep Learning.",
        modelsIntegrated: "Modelos entrenados e integrados",

        technicalStatus: "ESTADO TÉCNICO",
        systemTitle: "Estado del sistema",
        checkServer: "Comprobar servidor",

        // Mensajes dinámicos
        serverConnected: "Servidor conectado correctamente.",
        serverError: "No se pudo conectar con el servidor.",
        loadingEnvironment: "Consultando datos ambientales...",
        environmentLoaded: "Datos ambientales cargados correctamente.",
        environmentError: "No se pudieron cargar los datos ambientales.",
        loadingRotation: "Analizando alternativas de rotación...",
        rotationLoaded: "Análisis de rotación completado.",
        rotationError: "No se pudo completar el análisis de rotación.",
        locationConfirmed: "Ubicación confirmada correctamente.",
        locationError: "No se pudo confirmar la ubicación.",
        invalidLatitude: "Introduce una latitud entre -90 y 90.",
        invalidLongitude: "Introduce una longitud entre -180 y 180.",
        predictionLoading: "Analizando los datos con los modelos de IA...",
        predictionComplete: "Predicción experimental completada.",
        predictionError: "No se pudo completar la predicción.",
        experimentalWarning:
            "Los resultados son experimentales y no constituyen una recomendación agronómica validada.",
        validationWarning:
            "Valida los resultados con datos agrícolas representativos de la zona antes de tomar decisiones.",

        footer:
            "AgroOrbit · Prototipo académico funcional · Los resultados de IA son experimentales y requieren validación con datos agrícolas representativos del Perú."
    },

    en: {
        step1: "STEP 01",
        step2: "STEP 02",
        step3: "STEP 03",
        step4: "STEP 04",
        checkingServer: "Checking server...",
        pageTitle: "AgroOrbit | Smart Agriculture",
        brandSubtitle: "Smart Agriculture",
        prototype: "Functional Prototype",

        eyebrow: "DATA-DRIVEN AGRICULTURE",
        heroTitle: "Grow smarter.",
        heroTitleSecond: "Make evidence-based decisions.",
        heroDescription:
            "Analyze the environmental conditions of your location and plan crop rotation decisions.",

        locationTitle: "Farm Location",
        locationDescription:
            "Use your current location or enter the coordinates of the field you want to analyze.",
        detectLocation: "Detect My Location",
        manualCoordinates: "Or enter coordinates manually",
        latitude: "Latitude",
        longitude: "Longitude",
        confirmLocation: "Confirm Location",
        noLocation: "No location has been confirmed yet.",

        environmentTitle: "Environmental Data",
        environmentDescription:
            "Retrieve environmental variables for the confirmed coordinates.",
        period: "Query Period",
        last7Days: "Last 7 available days",
        last30Days: "Last 30 available days",
        last90Days: "Last 90 available days",
        queryNasa: "Query NASA POWER",
        confirmLocationFirst: "Please confirm a location first.",

        rotationTitle: "Smart Crop Rotation",
        rotationDescription:
            "Select the current crop to explore alternatives calculated by AgroOrbit's rules.",
        currentCrop: "Current Crop",
        loadingCrops: "Loading available crops...",
        analyzeRotation: "Analyze Rotation",

        aiTitle: "Intelligent Crop Prediction",
        aiDescription:
            "Enter field data to compare predictions from the Machine Learning and Deep Learning models.",
        nitrogen: "Nitrogen (N)",
        phosphorus: "Phosphorus (P)",
        potassium: "Potassium (K)",
        temperature: "Temperature (°C)",
        humidity: "Humidity (%)",
        soilPh: "Soil pH",
        rainfall: "Rainfall (mm)",
        demoValues:
            "Enter field measurements when available. The initial values are for demonstration only.",
        predictCrop: "Predict Crop",
        readyPrediction: "Ready to run an experimental prediction.",

        featureEnvironment: "Environmental Data",
        environmentFeatureDescription:
            "Retrieve temperature, precipitation, and solar radiation data through NASA POWER.",
        nasaIntegrated: "NASA POWER integration",

        featureRotation: "Crop Rotation",
        rotationFeatureDescription:
            "Explore alternatives using the crop rotation rules implemented in AgroOrbit.",
        rulesIntegrated: "Rules engine integrated",

        featureAI: "Artificial Intelligence",
        aiFeatureDescription:
            "Compare experimental results from the Machine Learning and Deep Learning models.",
        modelsIntegrated: "Trained models integrated",

        technicalStatus: "TECHNICAL STATUS",
        systemTitle: "System Status",
        checkServer: "Check Server",

        // Dynamic messages
        serverConnected: "Server connected successfully.",
        serverError: "Could not connect to the server.",
        loadingEnvironment: "Fetching environmental data...",
        environmentLoaded: "Environmental data loaded successfully.",
        environmentError: "Could not load environmental data.",
        loadingRotation: "Analyzing crop rotation alternatives...",
        rotationLoaded: "Crop rotation analysis completed.",
        rotationError: "Could not complete the crop rotation analysis.",
        locationConfirmed: "Location confirmed successfully.",
        locationError: "Could not confirm the location.",
        invalidLatitude: "Enter a latitude between -90 and 90.",
        invalidLongitude: "Enter a longitude between -180 and 180.",
        predictionLoading: "Analyzing data with the AI models...",
        predictionComplete: "Experimental prediction completed.",
        predictionError: "Could not complete the prediction.",
        experimentalWarning:
            "The results are experimental and are not a validated agronomic recommendation.",
        validationWarning:
            "Validate the results using agricultural data representative of the area before making decisions.",

        footer:
            "AgroOrbit · Functional academic prototype · AI results are experimental and require validation with agricultural data representative of Peru."
    }
};

/**
 * Obtiene una traducción para el idioma activo.
 * Si falta la clave, devuelve el texto alternativo indicado.
 */
function agroTranslate(key, fallback = "") {
    const language = document.documentElement.lang === "en" ? "en" : "es";

    return translations[language]?.[key]
        ?? translations.es?.[key]
        ?? fallback
        ?? key;
}

/**
 * Aplica las traducciones a los elementos estáticos del HTML.
 */
function applyLanguage(language) {
    const selectedLanguage = translations[language] ? language : "es";

    document.documentElement.lang = selectedLanguage;

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.dataset.i18n;
        const translatedText = translations[selectedLanguage][key];

        if (translatedText !== undefined) {
            element.textContent = translatedText;
        }
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
        const key = element.dataset.i18nPlaceholder;
        const translatedText = translations[selectedLanguage][key];

        if (translatedText !== undefined) {
            element.placeholder = translatedText;
        }
    });

    document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
        const key = element.dataset.i18nAriaLabel;
        const translatedText = translations[selectedLanguage][key];

        if (translatedText !== undefined) {
            element.setAttribute("aria-label", translatedText);
        }
    });

    document.title = translations[selectedLanguage].pageTitle;

    const languageButton = document.getElementById("language-toggle");

    if (languageButton) {
        languageButton.textContent =
            selectedLanguage === "es" ? "🇺🇸 EN" : "🇪🇸 ES";

        languageButton.setAttribute(
            "aria-label",
            selectedLanguage === "es"
                ? "Switch to English"
                : "Cambiar a español"
        );
    }

    try {
        localStorage.setItem("agroorbit-language", selectedLanguage);
    } catch (error) {
        // El cambio de idioma funciona aunque localStorage no esté disponible.
    }
}

function toggleLanguage() {
    const currentLanguage = document.documentElement.lang || "es";
    applyLanguage(currentLanguage === "es" ? "en" : "es");
}

document.addEventListener("DOMContentLoaded", () => {
    let savedLanguage = "es";

    try {
        savedLanguage = localStorage.getItem("agroorbit-language") || "es";
    } catch (error) {
        // Si no se puede leer el idioma guardado, se utiliza español.
    }

    applyLanguage(savedLanguage);

    const languageButton = document.getElementById("language-toggle");

    if (languageButton) {
        languageButton.addEventListener("click", toggleLanguage);
    }
});

// Permite que app.js y ai.js soliciten traducciones.
window.agroTranslate = agroTranslate;
window.applyAgroLanguage = applyLanguage;
