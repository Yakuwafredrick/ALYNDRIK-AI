// voice-announcer.js

let voiceUnlocked = false;
let isSpeaking = false;
const speechQueue = [];

// 🔓 Unlock speech (Android / WebView safe)
function unlockVoiceOnce() {
    if (voiceUnlocked) return;
    voiceUnlocked = true;

    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    speechSynthesis.speak(silent);

    console.log("🔓 Voice unlocked");
}

// Unlock on first user interaction
["click", "touchstart", "keydown"].forEach(evt => {
    window.addEventListener(evt, unlockVoiceOnce, { once: true });
});

// 🔊 Internal queue processor (STRICTLY SEQUENTIAL)
function processQueue() {
    if (isSpeaking || speechQueue.length === 0) return;

    const text = speechQueue.shift();
    isSpeaking = true;

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onend = () => {
        isSpeaking = false;
        processQueue(); // speak next ONLY after finish
    };

    utterance.onerror = (e) => {
        console.warn("❌ Speech error:", e);
        isSpeaking = false;
        processQueue();
    };

    unlockVoiceOnce();
    speechSynthesis.speak(utterance);
}

// ✅ PUBLIC API — ONLY ENTRY POINT
export function speakSystemMessage(text) {
    if (!text) return;

    speechQueue.push(text);
    processQueue();
}

// (Optional) Debug helper
export function isVoiceBusy() {
    return isSpeaking || speechQueue.length > 0;
}

