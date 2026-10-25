const aiForm = document.getElementById("ai-form");
const aiButton = document.getElementById("ai-predict-button");
const aiStatus = document.getElementById("ai-status");
const aiResults = document.getElementById("ai-results");
const aiWarning = document.getElementById("ai-warning");

const cropNames = {
    rice: "Arroz",
    maize: "Maíz",
    chickpea: "Garbanzo",
    kidneybeans: "Frijol",
    pigeonpeas: "Guandú",
    mothbeans: "Frijol moth",
    mungbean: "Frijol mungo",
    blackgram: "Frijol negro",
    lentil: "Lenteja",
    pomegranate: "Granada",
    banana: "Plátano",
    mango: "Mango",
    grapes: "Uva",
    watermelon: "Sandía",
    muskmelon: "Melón",
    apple: "Manzana",
    orange: "Naranja",
    papaya: "Papaya",
    coconut: "Coco",
    cotton: "Algodón",
    jute: "Yute",
    coffee: "Café"
};

function showModelResult(title, result) {
    const card = document.createElement("article");
    card.className = "ai-result-card";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const crop = document.createElement("p");
    crop.className = "ai-crop-name";

    const cropId = String(result.crop);
    crop.textContent = cropNames[cropId] || cropId;

    const probability = document.createElement("p");
    probability.className = "ai-probability";

    const percent = Number(result.model_probability) * 100;
    probability.textContent = Number.isFinite(percent)
        ? `Probabilidad del modelo: ${percent.toFixed(2)} %`
        : "Probabilidad no disponible";

    card.append(heading, crop, probability);
    return card;
}

aiForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    aiButton.disabled = true;
    aiStatus.textContent = "Ejecutando los modelos de IA...";
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
        const value = Number(formData.get(key));

        if (!Number.isFinite(value)) {
            aiStatus.textContent = "Revisa los datos introducidos.";
            aiButton.disabled = false;
            return;
        }

        values[key] = value;
    }

    if (
        values.N < 0 || values.P < 0 || values.K < 0 ||
        values.humidity < 0 || values.humidity > 100 ||
        values.ph < 0 || values.ph > 14 ||
        values.rainfall < 0
    ) {
        aiStatus.textContent =
            "Revisa los valores: nutrientes y lluvia no negativos, " +
            "humedad entre 0 y 100 y pH entre 0 y 14.";
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

        const result = await response.json();

        if (!response.ok) {
            const detail = typeof result.detail === "string"
                ? result.detail
                : "No se pudo procesar la predicción.";

            throw new Error(detail);
        }

        aiResults.append(
            showModelResult(
                "Machine Learning",
                result.machine_learning
            ),
            showModelResult(
                "Deep Learning",
                result.deep_learning
            )
        );

        aiResults.hidden = false;

        aiStatus.textContent = result.models_agree
            ? "Ambos modelos predicen el mismo cultivo."
            : "Los modelos presentan resultados diferentes.";

        aiWarning.textContent = result.warning ||
            "Resultado experimental. Verifica los datos y la recomendación.";
        aiWarning.hidden = false;

    } catch (error) {
        aiStatus.textContent =
            `No se pudo realizar la predicción: ${error.message}`;
    } finally {
        aiButton.disabled = false;
    }
});