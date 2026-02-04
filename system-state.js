// system-state.js

export const SystemState = {
    online: navigator.onLine,
    model: null,
    usage: "normal", // normal | high | critical
    healthy: true,
};

export function updateSystemState(updates = {}) {
    Object.assign(SystemState, updates);
    console.log("🧠 System State Updated:", SystemState);
}

export function runHealthCheck() {
    const issues = [];

    if (!navigator.onLine) issues.push("offline");
    if (!SystemState.model) issues.push("model_not_ready");
    if (SystemState.usage === "critical") issues.push("high_usage");

    SystemState.healthy = issues.length === 0;

    return {
        healthy: SystemState.healthy,
        issues,
        message: generateHealthMessage(issues),
    };
}

function generateHealthMessage(issues) {
    if (issues.length === 0) {
        return "✅ Alyndrik status: All systems are healthy.";
    }
    if (issues.includes("offline")) {
        return "Waring. Alyndrik Ai system is running offline with limited capabilities. Please, i would need to restart.";
    }
    if (issues.includes("high_usage")) {
        return "Warning. Alyndrik is under high system load.";
    }
    return "Warning. Alyndrik system state is partially limited. You're likely to experience occassional delays and temporary service disruptions. To fix this, ensure you have a stable Network in your location";
}