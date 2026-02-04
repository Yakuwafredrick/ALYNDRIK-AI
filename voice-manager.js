let selectedVoice = null;

/**
 * Pick the best available female voice
 */
function chooseBestFemaleVoice() {
    const voices = speechSynthesis.getVoices();

    if (!voices.length) return null;

    // Priority list (best → fallback)
    const preferred = [
        // Android / Chrome
        "Google UK English Female",
        "Google US English",
        "en-US",
        "en-GB"
    ];

    // 1️⃣ Exact matches
    for (const name of preferred) {
        const v = voices.find(voice =>
            voice.name.toLowerCase().includes(name.toLowerCase())
        );
        if (v) return v;
    }

    // 2️⃣ Any female English voice
    const female = voices.find(v =>
        v.lang.startsWith("en") &&
        /female|woman|girl/i.test(v.name)
    );
    if (female) return female;

    // 3️⃣ Any English voice
    return voices.find(v => v.lang.startsWith("en")) || voices[0];
}

/**
 * Initialize voice system (call once)
 */
export function initVoice() {
    return new Promise(resolve => {
        const load = () => {
            selectedVoice = chooseBestFemaleVoice();
            console.log("🎤 Selected voice:", selectedVoice?.name);
            resolve(selectedVoice);
        };

        load();

        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = load;
        }
    });
}

/**
 * Speak with natural female settings
 */
export function speakNatural(text) {
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);

    if (selectedVoice) utterance.voice = selectedVoice;

    // 🌸 Natural female tuning
    utterance.rate = 0.95;   // Slightly slower
    utterance.pitch = 1.15;  // Feminine pitch
    utterance.volume = 1.0;

    speechSynthesis.cancel(); // Prevent overlap
    speechSynthesis.speak(utterance);
}