
"use strict";

const aiForm = document.getElementById("ai-form");
const aiButton = document.getElementById("ai-predict-button");
const aiStatus = document.getElementById("ai-status");
const aiResults = document.getElementById("ai-results");
const aiWarning = document.getElementById("ai-warning");

const cropNames = {
    rice: { es: "Arroz", en: "Rice" },
    maize: { es: "Maíz", en: "Maize" },
    chickpea: { es: "Garbanzo", en: "Chickpea" },
    kidneybeans: { es: "Frijol", en: "Kidney beans" },
    pigeonpeas: { es: "Guandú", en: "Pigeon peas" },
    mothbeans: { es: "Frijol moth", en: "Moth beans" },
    mungbean: { es: "Frijol mungo", en: "Mung bean" },
    blackgram: { es: "Frijol negro", en: "Black gram" },
    lentil: { es: "Lenteja", en: "Lentil" },
    pomegranate: { es: "Granada", en: "Pomegranate" },
    banana: { es: "Plátano", en: "Banana" },
    mango: { es: "Mango", en: "Mango" },
    grapes: { es: "Uva", en: "Grapes" },
    watermelon: { es: "Sandía", en: "Watermelon" },
    muskmelon: { es: "Melón", en: "Muskmelon" },
    apple: { es: "Manzana", en: "Apple" },
    orange: { es: "Naranja", en: "Orange" },
    papaya: { es: "Papaya", en: "Papaya" },
    coconut: { es: "Coco", en: "Coconut" },
    cotton: { es: "Algodón", en: "Cotton" },
    jute: { es: "Yute", en: "Jute" },
    coffee: { es: "Café", en: "Coffee" }
};

function aiText(spanish, english) {
    const language = document.documentElement.lang === "en" ? "en" : "es";
    return language === "en" ? english : spanish;
}

function currentLanguage() {
    return document.documentElement.lang === "en" ? "en" : "es";
}

function translateCrop(cropId) {
    const language = currentLanguage();
    const key = String(cropId ?? "").trim().toLowerCase();

    return cropNames[key]?.[language] || String(cropId ?? "—");
}

function showModelResult(title, result) {
    const card = document.createElement("article");
    card.className = "ai-result-card";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const crop = document.createElement("p");
    crop.className = "ai-crop-name";
    crop.textContent = translateCrop(result?.crop);

    const probability = document.createElement("p");
    probability.className = "ai-probability";

    const rawProbability = Number(result?.model_probability);
    const percent = rawProbability * 100;

    probability.textContent = Number.isFinite(rawProbability)
        ? aiText(
            `Probabilidad del modelo: ${percent.toFixed(2)} %`,
            `Model probability: ${percent.toFixed(2)}%`
        )
        : aiText(
            "Probabilidad no disponible",
            "Probability unavailable"
        );

    card.append(heading, crop, probability);
    return card;
}

function getErrorMessage(error) {
    const message = String(error?.message || "").toLowerCase();

    // Evita mostrar mensajes técnicos del servidor en el idioma equivocado.
    if (
        message.includes("failed to fetch") ||
        message.includes("networkerror") ||
        message.includes("network request failed")
    ) {
        return aiText(
            "No se pudo conectar con el servidor. Comprueba que el backend esté funcionando.",
            "Could not connect to the server. Check that the backend is running."
        );
    }

    return aiText(
        "No se pudo realizar la predicción. Revisa la conexión y los datos e inténtalo de nuevo.",
        "The prediction could not be completed. Check the connection and input data, then try again."
    );
}

function getWarningMessage(serverWarning) {
    /*
     * El backend puede devolver advertencias en un solo idioma.
     * Para garantizar una interfaz coherente, mostramos una advertencia
     * controlada por el frontend en el idioma activo.
     */
    return aiText(
        "Resultado experimental: los modelos no garantizan que el cultivo sea adecuado para tu parcela. Verifica los datos y valida la recomendación con información agrícola local.",
        "Experimental result: the models cannot guarantee that a crop is suitable for your field. Check the data and validate the recommendation using local agricultural information."
    );
}

if (aiForm && aiButton && aiStatus && aiResults && aiWarning) {
    aiForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        aiButton.disabled = true;

        aiStatus.textContent = aiText(
            "Ejecutando los modelos de IA...",
            "Running the AI models..."
        );

        aiResults.replaceChildren();
        aiResults.hidden = true;
        aiWarning.hidden = true;
        aiWarning.textContent = "";

        const formData = new FormData(aiForm);
        const values = {};

        for (const key of [
            "N", "P", "K", "temperature",
            "humidity", "ph", "rainfall"
        ]) {
            const rawValue = formData.get(key);

            if (rawValue === null || String(rawValue).trim() === "") {
                aiStatus.textContent = aiText(
                    "Completa todos los campos numéricos.",
                    "Complete all numeric fields."
                );
                aiButton.disabled = false;
                return;
            }

            const value = Number(rawValue);

            if (!Number.isFinite(value)) {
                aiStatus.textContent = aiText(
                    "Revisa los datos introducidos.",
                    "Check the entered values."
                );
                aiButton.disabled = false;
                return;
            }

            values[key] = value;
        }

        if (
            values.N < 0 ||
            values.P < 0 ||
            values.K < 0 ||
            values.temperature < -20 ||
            values.temperature > 70 ||
            values.humidity < 0 ||
            values.humidity > 100 ||
            values.ph < 0 ||
            values.ph > 14 ||
            values.rainfall < 0
        ) {
            aiStatus.textContent = aiText(
                "Revisa los valores: los nutrientes y la lluvia no pueden ser negativos; la temperatura debe estar entre -20 y 70 °C, la humedad entre 0 y 100 y el pH entre 0 y 14.",
                "Check the values: nutrients and rainfall cannot be negative; temperature must be between -20 and 70 °C, humidity between 0 and 100, and pH between 0 and 14."
            );

            aiButton.disabled = false;
            return;
        }

        try {
            const response = await fetch("/api/ai/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(values)
            });

            let result;

            try {
                result = await response.json();
            } catch {
                throw new Error("invalid_response");
            }

            if (!response.ok) {
                throw new Error("server_error");
            }

            if (
                !result?.machine_learning?.crop ||
                !result?.deep_learning?.crop
            ) {
                throw new Error("invalid_result");
            }

            aiResults.append(
                showModelResult("Machine Learning", result.machine_learning),
                showModelResult("Deep Learning", result.deep_learning)
            );

            aiResults.hidden = false;

            aiStatus.textContent = result.models_agree
                ? aiText(
                    "Ambos modelos predicen el mismo cultivo.",
                    "Both models predict the same crop."
                )
                : aiText(
                    "Los modelos presentan resultados diferentes.",
                    "The models produce different results."
                );

            aiWarning.textContent = getWarningMessage(result.warning);
            aiWarning.hidden = false;

        } catch (error) {
            console.error("AgroOrbit AI error:", error);

            aiStatus.textContent = getErrorMessage(error);

        } finally {
            aiButton.disabled = false;
        }
    });
}
