// En este módulo añadiremos los gráficos ambientales
// cuando integremos los datos reales de NASA POWER.

function formatEnvironmentalValue(value, unit) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return "Dato no disponible";
    }

    return `${value.toFixed(1)} ${unit}`;
}