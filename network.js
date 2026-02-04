// network.js
const NetworkState = {
    status: "unknown", // offline | poor | stable
    lastLatency: null
};

const listeners = new Set();

export function onNetworkChange(cb) {
    listeners.add(cb);
}

function notify() {
    listeners.forEach(cb => cb({ ...NetworkState }));
}

export async function detectNetworkStatus() {
    if (!navigator.onLine) return { status: "offline", latency: null };

    const start = performance.now();
    try {
        await fetch("/ping.json", { cache: "no-store" });
        const latency = performance.now() - start;

        const status = latency > 1500 ? "poor" : "stable";
        return { status, latency };
    } catch {
        return { status: "offline", latency: null };
    }
}

export async function checkNetworkHealth(force = false) {
    const result = await detectNetworkStatus();

    const changed =
        force ||
        result.status !== NetworkState.status ||
        Math.abs((result.latency ?? 0) - (NetworkState.lastLatency ?? 0)) > 500;

    if (!changed) return null;

    NetworkState.status = result.status;
    NetworkState.lastLatency = result.latency;

    notify();
    return { ...NetworkState };
}

// Auto hooks
window.addEventListener("online", () => checkNetworkHealth(true));
window.addEventListener("offline", () => checkNetworkHealth(true));