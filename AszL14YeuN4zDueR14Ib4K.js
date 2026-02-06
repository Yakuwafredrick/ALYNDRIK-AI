import { initVoice, speakNatural } from "./voice-manager.js";
import { checkNetworkHealth, onNetworkChange } from "./network.js";
import {
    SystemState,
    updateSystemState,
    runHealthCheck
} from "./system-state.js";

//import {
    //speakNatural
//} from "./voice-announcer.js";

import {
    
    getActiveModel,
    setActiveModel,
    resolveModelByUsage,
    isModelSwitchRequired,
    getModelSwitchMessage
} from "./model-manager.js";

import {
    maybeGenerateImage,
    maybeGenerateVideo
} from './img.js';
// NEW: Import the usage tracker functions
import {
    handleSendMessageAttempt,
    isChatTemporarilyBlocked
} from './time-tracker.js';

window.addEventListener("load", async () => {
    await initVoice();
});

let lastSpokenNetworkStatus = null;
let networkStabilizeTimer = null;

let lastAnnouncementTime = 0;
function announceSystemMessageThrottled(messageObj, opts = {}) {
    const now = Date.now();
    if (now - lastAnnouncementTime < 1200) {
        setTimeout(() => announceSystemMessage(messageObj, opts), 1200);
        return;
    }
    lastAnnouncementTime = now;
    announceSystemMessage(messageObj, opts);
}

const NETWORK_MESSAGES = {
    offline: {
        popup: "⚠️ You're Offline.",
        voice: "Alert. Internet connection is unavailable. I am currently offline and cannot fetch new data."
    },
    poor: {
        popup: "⚠️ Network is unstable.",
        voice: "Alert. Network is unstable in this location. I am unable to fetch all the required data."
    },
    stable: {
        popup: "✅ Network connection is stable.",
        voice: "Network connection is stable. All services are operating normally. However, i might need to reconnect and reload my systems to ensure everything's running smoothly."
    }
};

onNetworkChange(state => {
    if (state.status === lastSpokenNetworkStatus) return;

    lastSpokenNetworkStatus = state.status;

    clearTimeout(networkStabilizeTimer);

    networkStabilizeTimer = setTimeout(() => {
        const msg = NETWORK_MESSAGES[state.status] || {
    popup: "⚠️ Network status unknown.",
    voice: "Network status could not be determined. Please, check your internet connection and restart"
};

announceSystemMessageThrottled(
    {
        popup: msg.popup,
        voice: msg.voice
    },
    { type: state.status === "stable" ? "success" : "warning" }
);

        handleModelAutoSwitch();
    }, state.status === "stable" ? 2500 : 0); // wait before saying “online”
});

console.log("🚀 main.js STARTED");

// ===============================
// 🌟 Gemini Models
// ===============================
const GEMINI_MODELS = {
    FLASH: "gemini-2.5-flash",
    FLASH_LITE: "gemini-2.5-flash-lite"
};

// ===============================
// 🧪 DEBUG / CONSOLE TEST HOOKS
// ===============================
window.ALYNDRIK_DEBUG = {
    updateSystemState,
    runHealthCheck,
    speakNatural,
    SystemState,
    switchGeminiModel
};

console.log("🧪 Alyndrik debug tools exposed as window.ALYNDRIK_DEBUG");

document.addEventListener("DOMContentLoaded", () => {
    const health = runHealthCheck();

    // Chat message
    addSystemMessage(health.message);

    // Voice announcement
    speakNatural(health.message);
});

let lastNotifiedModel = "gemini-2.5-flash-lite"; // default

// 🔧 DEBUG OVERRIDE
let __forceBlocked = null;

function isBlockedForAutoSwitch() {
    if (__forceBlocked !== null) return __forceBlocked;
    return isChatTemporarilyBlocked();
}
// ===============================
// 🔄 Auto-switch between FLASH and FLASH_LITE
// ===============================
async function handleModelAutoSwitch(force = false) {
    if (!modelReady || !genAIInstance) return;

    const currentModel = lastNotifiedModel;

    // Force Lite switch if force=true or API blocked
    if (force || currentModel !== GEMINI_MODELS.FLASH_LITE) {
        console.log("🎯 Auto-switching to Lite model due to 429 or force.");
        lastModelSwitchTime = Date.now();

        await switchGeminiModel(GEMINI_MODELS.FLASH_LITE);

        // Immediate popup and voice announcement
        announceSystemMessageThrottled({
            popup: "⚠️ Usage limit reached. Switching to Lite AI model.",
            voice: "Warning. The usage limit is reached. I need to switch to Lite AI model, or take a break."
        }, { type: "warning" });
    }
}

// Expose for console testing
window.handleModelAutoSwitch = handleModelAutoSwitch;

// ===============================
// 🧪 DEBUG / CONSOLE TEST HOOKS
// ===============================
window.testAutoSwitch = handleModelAutoSwitch;
window.getLastNotifiedModel = () => lastNotifiedModel;

console.log("🧪 Auto-switch test helpers exposed");

console.log("🧠 Model Manager loaded. Initial model:", getActiveModel());


// Add a global flag to prevent multiple message sends simultaneously
let isMessageProcessing = false;

// ✅ Register Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js")
      .then(() => console.log("✅ SW registered"))
      .catch(err => console.error("❌ SW failed:", err));
  });
}

// ✅ App Version Control
const currentAppVersion = "2.0.4";
// Renamed to clarify its purpose: disabled specifically by version check
let isChatDisabledByVersion = true;

// 🎤 Voice queue
const speechQueue = [];
let isSpeaking = false;

function speakNaturalLocal(text) {
    if (!text) return;

    speechQueue.push(text);
    processSpeechQueue();
}

function processSpeechQueue() {
    if (isSpeaking || speechQueue.length === 0) return;

    const msg = speechQueue.shift();
    const utterance = new SpeechSynthesisUtterance(msg);
    
    utterance.onend = () => {
        isSpeaking = false;
        processSpeechQueue(); // Speak next in queue
    };
    utterance.onerror = () => {
        console.warn("❌ Speech synthesis error for:", msg);
        isSpeaking = false;
        processSpeechQueue();
    };

    // Unlock voice on first attempt (Android WebView issue)
    unlockVoiceOnce();

    isSpeaking = true;
    speechSynthesis.speak(utterance);
}

// 🔓 Unlock speech synthesis for Android WebView
let voiceUnlocked = false;

function unlockVoiceOnce() {
    if (voiceUnlocked) return;
    voiceUnlocked = true;

    const unlockUtterance = new SpeechSynthesisUtterance("");
    speechSynthesis.speak(unlockUtterance);

    console.log("🔓 Voice system unlocked");
}

// Unlock on first user interaction
["click", "touchstart", "keydown"].forEach(evt => {
    window.addEventListener(evt, unlockVoiceOnce, { once: true });
});


// ✅ Version Checker
async function checkForUpdates(showLog = true) {
    try {
        if (showLog) console.log("🔍 Checking for updates online...");
        const response = await fetch("https://botversion.netlify.app/version.json", {
            cache: "no-store"
        });
        const data = await response.json();
        const latestVersion = data.version;
        const minimumRequired = data.minimum_required;

        // Cache version info for offline use
        localStorage.setItem("latestVersion", latestVersion);
        localStorage.setItem("minimumRequiredVersion", minimumRequired);

        // Cache the update page for offline access (best-effort)
        cacheUpdatePage("https://meang1.blogspot.com/2025/08/alyndrik-chatbot.html");

        // If server says there's a newer version (major update)
        if (latestVersion !== currentAppVersion) {
            // Notify user and force them to update (confirm gives chance to open link)
            const updateConfirmed = confirm(
                `🚀 Alyndrik Chatbot updated to v${latestVersion}.\n\nClick OK to update now.\nOr Cancel to stay, but you must update before continuing.`
            );

            if (updateConfirmed) {
                // Redirect user to update page (will open cached copy if available)
                location.href = "https://meang1.blogspot.com/2025/08/alyndrik-chatbot.html";
                return;
            } else {
                // User declined — force disable and show overlay
                disableChatbot();
                return;
            }
        }

        // If current version is below minimum required -> force update
        if (compareVersions(currentAppVersion, minimumRequired) < 0) {
            disableChatbot();
            return;
        }

        // ✅ Version passed — unlock chatbot
        enableChatbot();

    } catch (err) {
        console.warn("⚠️ Online Version check failed:", err);
        checkOfflineVersion();
    }
}

// ✅ Cache the update page for offline (best-effort)
async function cacheUpdatePage(url) {
    if (!('caches' in window)) return;
    try {
        const cache = await caches.open('yakuwaz-updates-v1');
        const cachedResponse = await cache.match(url);
        // Only fetch & cache if we are online and the resource isn't cached yet
        if (!cachedResponse && navigator.onLine) {
            const resp = await fetch(url, {
                cache: "no-store"
            });
            if (resp && resp.ok) await cache.put(url, resp.clone());
        }
    } catch (err) {
        console.warn("⚠️ Failed to cache update page:", err);
    }
}

// ✅ Offline enforcement check (used at startup)
function enforceUpdateOffline() {
    const minimumRequired = localStorage.getItem("minimumRequiredVersion");
    if (minimumRequired && compareVersions(currentAppVersion, minimumRequired) < 0) {
        console.warn("🚫 Offline enforcement: Chatbot blocked until update.");
        disableChatbot();
        return true;
    }
    return false;
}

function checkOfflineVersion() {
    const minimumRequired = localStorage.getItem("minimumRequiredVersion");
    const latestVersion = localStorage.getItem("latestVersion");

    if (minimumRequired && compareVersions(currentAppVersion, minimumRequired) < 0) {
        console.warn("🚫 Offline check: Current version below required minimum.");
        disableChatbot();
        return;
    }

    if (latestVersion && compareVersions(currentAppVersion, latestVersion) < 0) {
        console.warn("⚠️ Offline check: Newer version available.");
        disableChatbot();
        return;
    }

    // ✅ Offline check passed — unlock chatbot
    enableChatbot();
}

function compareVersions(v1, v2) {
    const a = (v1 || "").split('.').map(Number);
    const b = (v2 || "").split('.').map(Number);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const n1 = a[i] || 0;
        const n2 = b[i] || 0;
        if (n1 < n2) return -1;
        if (n1 > n2) return 1;
    }
    return 0;
}

// Function to format chat responses - NEWLY ADDED ✨
function formatChatResponse(text) {
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/--- ###/g, '</p><p>');
    return text;
}

// NEW: Consolidated function to update the enabled/disabled state of chat controls
function updateChatControlsState() {
    const input = document.querySelector(".chat-window input");
    const sendButton = document.querySelector(".chat-window .input-area button");

    // Determine if controls should be disabled based on both version updates AND usage limits
    const shouldBeDisabled = isChatDisabledByVersion || isChatTemporarilyBlocked();

    if (input) input.disabled = shouldBeDisabled;
    if (sendButton) sendButton.disabled = shouldBeDisabled;
}

// ✅ Disable Chatbot UI (for version updates)
function disableChatbot() {
    isChatDisabledByVersion = true;
    updateChatControlsState(); // Re-evaluate button state based on both flags
    showUpdateOverlay();
}

// ✅ Enable Chatbot UI (for version updates)
function enableChatbot() {
    isChatDisabledByVersion = false;
    updateChatControlsState(); // Re-evaluate button state based on both flags
}

// Removed the old `lockUI` and `unlockUI` functions as `updateChatControlsState` replaces their logic.

// ✅ Update Overlay (persistent / static)
function showUpdateOverlay() {
    // don't append more than one overlay
    if (document.getElementById('yakuwaz-update-overlay')) return;

    const overlay = document.createElement("div");
    overlay.id = 'yakuwaz-update-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.background = 'linear-gradient(to bottom right, #f5f7fa, #c3cfe2)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

    overlay.innerHTML = `
      <div style="user-select: none; background: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); text-align: center; max-width: 420px; width: 90%;">
        <div style="user-select: none; font-size: 50px; color: #ff4d4f; margin-bottom: 15px;">🚫</div>
        <h2 style="user-select: none; font-size: 24px; margin-bottom: 10px; color: #333;">
          This version of Alyndrik Chatbot is outdated
        </h2>
        <p style="user-select: none; font-size: 16px; color: #666; margin-bottom: 25px;">
          Please update to continue using the latest features and improvements.
        </p>

        <div style="margin-bottom:12px;">
          <a id="yakuwaz-update-link" href="https://meang1.blogspot.com/2025/08/alyndrik-chatbot.html" target="_blank" style="display:inline-block;padding:12px 24px;background-color:#007bff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;transition:background 0.3s ease;">
            🔄 Go to YakuwaTechnologies
          </a>
        </div>

        <div style="font-size:13px;color:#999;">This screen will remain until you install the required update.</div>
      </div>
    `;

    document.body.appendChild(overlay);

    const updateLink = document.getElementById('yakuwaz-update-link');
    if (updateLink) {
        updateLink.addEventListener('click', async (e) => {
            // Let the default navigation happen; nothing else needed.
        });
    }
}

// ✅ When Internet Connection Restores
window.addEventListener('online', () => {
    console.log("🌐 Connection restored — Rechecking for updates...");
    checkForUpdates(false);
});

// ✅ Periodic Online Check (APK/WebView Safe)
setInterval(async () => {
    // only attempt recheck when disabled by version (overlay shown) and device is online
    if (isChatDisabledByVersion && navigator.onLine) {
        console.log("🌐 Periodic check: Device is online, rechecking updates...");
        await checkForUpdates(false);
    }
}, 5000); // every 5 seconds



// ✅ Chat State
let messages = {
    history: JSON.parse(localStorage.getItem("yakuwaz_chat_history")) || [],
};

let model = null;

let genAIInstance = null;
let cachedSystemInstruction = "";

let modelReady = false;
const API_KEY = "AIzaSyCyj8L8QJImCJbQNJ6IiU3_1VXNug2LIFc";

// ✅ Import Info Modules
import {
    getChatInfo
} from './AszL14YeuN4zDueR14Ib4KInfo.js';
import {
    getBiologyPdfText
} from './pdfInfo.js';

// ✅ Load SDK and Initialize Model
async function loadSDK() {
    if ('caches' in window) {
        const cache = await caches.open('ai-sdk-cache');
        const sdkURL = 'https://esm.run/@google/generative-ai';
        let response = await cache.match(sdkURL);

        if (!response && navigator.onLine) {
            try {
                response = await fetch(sdkURL);
                if (response.ok) await cache.put(sdkURL, response.clone());
                else return console.error("❌ Failed to fetch SDK:", response.status);
            } catch (err) {
                return console.error("❌ SDK network error:", err);
            }
        }

        if (!response) return console.error("❌ SDK not found in cache & offline.");

        const sdkBlob = await response.blob();
        const sdkModuleURL = URL.createObjectURL(sdkBlob);
        const module = await import(sdkModuleURL);

        genAIInstance = new module.GoogleGenerativeAI(API_KEY);

        let biologyText = "⚠️ Biology notes loading failed.";
        try {
            biologyText = await getBiologyPdfText();
        } catch (err) {
            console.warn("⚠️ Using placeholder for biology notes.");
        }

            cachedSystemInstruction = `${getChatInfo()}\n\n📘 About Alyndrik & YakuwaTechnologies:\n${biologyText}`;
            
            // Choose the default model explicitly
const initialModel = GEMINI_MODELS.FLASH; // or FLASH_LITE if you prefer

model = genAIInstance.getGenerativeModel({
    model: initialModel,
    systemInstruction: cachedSystemInstruction,
});
            
            modelReady = true;
        console.log("✅ SDK loaded and model ready.");
    }
}

// Periodically check every 5 seconds for auto-switch
setInterval(() => {
    handleModelAutoSwitch().catch(err => console.error("Auto-switch error:", err));
}, 5000);

// After your SDK loads
modelReady = true;

// ===== Gemini Auto-Switch with System Messages & Voice =====
// just assign, do NOT redeclare
lastNotifiedModel = lastNotifiedModel || "gemini-2.5-flash-lite";

window.getLastNotifiedModel = () => lastNotifiedModel;

window.switchGeminiModel = async (newModelName) => {
    if (!modelReady) return lastNotifiedModel;
    if (lastNotifiedModel === newModelName) return lastNotifiedModel;

    lastNotifiedModel = newModelName;
    console.log(`✅ Switched Gemini model to: ${newModelName}`);

    if (typeof sendSystemMessage === "function")
        sendSystemMessage(`System: Switched to ${newModelName}`);

    if (typeof speakNatural === "function")
        speakNatural(`Switched to ${newModelName}`);

    if (genAIInstance?.getGenerativeModel)
        genAIInstance.getGenerativeModel().startChat();

    return newModelName;
};

window.testAutoSwitch = async (force) => {
    const targetModel = force ? "gemini-2.5-flash" : "gemini-2.5-flash-lite";
    await window.switchGeminiModel(targetModel);
};

window.autoSwitchGeminiModel = async () => {
    const target = __forceBlocked ? "gemini-2.5-flash" : "gemini-2.5-flash-lite";
    await window.switchGeminiModel(target);
};

// Optional: periodic check (10s)
//setInterval(() => {
    //window.autoSwitchGeminiModel();
//}, 10000);

// ===============================
// 🔊 Unified Auto System Message Handler
// ===============================
function announceSystemMessage({ popup, voice }, options = {}) {
    const type = options.type || "info";

    // ✅ Show popup ONLY
    showToast(popup, type);

    // 🔊 Speak ONLY voice text
    if (voice) speakNatural(voice);
}

let lastModelSwitchTime = 0;
const MODEL_SWITCH_COOLDOWN = 60 * 1000; // 1 minute



// ===============================
// 🔄 Auto-trigger important system messages after SDK & chat ready
// ===============================
async function triggerInitialSystemAnnouncements() {
    // 1️⃣ Alyndrik Health Check
    const health = runHealthCheck();

announceSystemMessage(
    {
        popup: "✅ System check completed.",
        voice: health.message || "System health check completed successfully."
    },
    { type: "success" }
);
    // 2️⃣ Check if model switch is needed
    if (modelReady && genAIInstance) {
        const usageRatio = 0.5; // Adjust or compute from saved usage
        if (isModelSwitchRequired(usageRatio)) {
            const targetModel = resolveModelByUsage(usageRatio);
            await switchGeminiModel(targetModel); // Already announces automatically
        }
    }

    // 3️⃣ Example: Announce SDK readiness
    if (modelReady) {
        announceSystemMessage(
    {
        popup: "✅ AI is ready.",
        voice: "The AI system and model are fully loaded and ready for use. However, i have to tell you that my performance and availability rely on external systems. A stable network and internet connection are required for full functionality to avoid delays or disruptions. Please, interact with me responsibly, usage is limited. Over interraction in a short period might make me go offline temporarily until my quota resets after 12 hours, depending on previous interactions. Thank you for Understanding."
    },
    { type: "success" }
);
    }

    // 4️⃣ Additional custom announcements can be added here
    // announceSystemMessage("⚠️ Reminder: Your chat session will expire in 5 minutes.", { type: "warning" });
}

// ===============================
// ✅ Hook into page load
// ===============================
window.addEventListener("load", async () => {
    if (!navigator.onLine || enforceUpdateOffline()) return;

    loadChatHistory();
    await loadSDK();
    autoRespondOnReload();
    checkForUpdates();
    updateChatControlsState();

    // Trigger all initial system announcements
    triggerInitialSystemAnnouncements();
});

// ✅ Load & Display Chat History
function loadChatHistory() {
    const chatContainer = document.querySelector(".chat-window .chat");
    if (!chatContainer) return;
    chatContainer.innerHTML = "";

    if (messages.history.length === 0) chatContainer.insertAdjacentHTML("beforeend", `<div class="model"><p>👋Hi, how can I help you?</p></div>`);
    else messages.history.forEach(msg => {
        const className = msg.role === "user" ? "user" : "model";
        const formattedText = formatChatResponse(msg.parts[0].text);
        chatContainer.insertAdjacentHTML("beforeend", `<div class="${className}"><p>${formattedText}</p></div>`);
    });
    scrollToBottom();
}

// ✅ Scroll to Bottom
function scrollToBottom() {
    const chatContainer = document.querySelector(".chat-window .chat");
    if (!chatContainer) return;
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ✅ Save Chat
function saveChatHistory() {
    localStorage.setItem("yakuwaz_chat_history", JSON.stringify(messages.history));
}

// ✅ Delete Chat
function deleteChatHistory() {
    messages.history = [];
    localStorage.removeItem("yakuwaz_chat_history");
    loadChatHistory();
    const chatContainer = document.querySelector(".chat-window .chat");
    if (chatContainer) chatContainer.innerHTML = `<div class="model"><p>👩‍💼Hi, Let's continue</p></div>`;
    scrollToBottom();
}

function showToast(message, type = "info", duration = 9500) {
    // Remove existing popup
    const old = document.getElementById("alyndrik-toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.id = "alyndrik-toast";

    let icon = "ℹ️";
    let bg = "#e7f1ff";
    let color = "#084298";
    let border = "#9ec5fe";

    if (type === "warning") {
        icon = "⚠️";
        bg = "#fff3cd";
        color = "#664d03";
        border = "#ffecb5";
    } else if (type === "success") {
        icon = "✅";
        bg = "#d1e7dd";
        color = "#0f5132";
        border = "#badbcc";
    }

    toast.innerHTML = `
        <div style="
            display:flex;
            gap:12px;
            align-items:flex-start;
        ">
            <div style="font-size:24px; line-height:1;">${icon}</div>
            <div style="flex:1;">
                <div style="font-weight:700; margin-bottom:4px;">
                    System Notice
                </div>
                <div style="line-height:1.4;">
                    ${message}
                </div>
            </div>
        </div>
    `;

    Object.assign(toast.style, {
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%) translateY(-20px)",
        maxWidth: "92%",
        width: "520px",
        background: bg,
        color: color,
        border: `2px solid ${border}`,
        borderRadius: "14px",
        padding: "14px 16px",
        zIndex: "100000",
        boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        fontSize: "0.95em",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto",
        opacity: "0",
        transition: "all 0.45s cubic-bezier(.22,.61,.36,1)"
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateX(-50%) translateY(0)";
    });

    // Auto dismiss
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(-50%) translateY(-20px)";
        setTimeout(() => toast.remove(), 950);
    }, duration);
}

window.showToast = showToast;

function addSystemMessage(text, type = "success") {
    // Do nothing here OR keep for future chat logging
    // Intentionally empty to avoid red popup
}

// ✅ Auto Respond if Reloaded
async function autoRespondOnReload() {
    if (messages.history.length > 0 && modelReady && !isChatDisabledByVersion && !isChatTemporarilyBlocked()) {
        const lastUser = [...messages.history].reverse().find(msg => msg.role === "user");
        const lastModel = [...messages.history].reverse().find(msg => msg.role === "model");

        if (lastUser && (!lastModel || messages.history.indexOf(lastUser) > messages.history.indexOf(lastModel))) {
            const chatContainer = document.querySelector(".chat-window .chat");
            const chat = model.startChat(messages);
            const result = await chat.sendMessageStream(lastUser.parts[0].text);

            if (chatContainer) chatContainer.insertAdjacentHTML("beforeend", `<div class="model"><p></p></div>`);
            scrollToBottom();

            let modelText = "";
            for await (const chunk of result.stream) {
                modelText += chunk.text();
                const modelReply = chatContainer ? chatContainer.querySelectorAll(".model") : [];
                if (modelReply && modelReply.length) {
                    modelReply[modelReply.length - 1].querySelector("p").innerHTML = formatChatResponse(modelText);
                }
                scrollToBottom();
            }

            messages.history.push({
                role: "model",
                parts: [{
                    text: modelText
                }]
            });
            saveChatHistory();
        }
    }
}

// ✅ Main Send Message Function (Modified for usage tracker)
async function sendMessage() {
    try {
        if (navigator.onLine) {
            await checkForUpdates(false);
        } else {
            enforceUpdateOffline();
        }
    } catch (err) {
        console.warn("⚠️ Update check failed:", err);
    }

    if (isChatDisabledByVersion) return;

    if (!handleSendMessageAttempt()) return;
    if (isMessageProcessing) return;
    isMessageProcessing = true;

    const input = document.querySelector(".chat-window input");
    const chatContainer = document.querySelector(".chat-window .chat");
    if (!input || !chatContainer) {
        isMessageProcessing = false;
        return;
    }

    const userMessage = input.value.trim();
    if (!userMessage) {
        isMessageProcessing = false;
        return;
    }

    input.value = "";
    chatContainer.insertAdjacentHTML(
        "beforeend",
        `<div class="user"><p>${userMessage}</p></div><div class="loader"></div>`
    );
    scrollToBottom();

    const loader = document.querySelector(".loader");

    try {
        if (navigator.onLine && modelReady) {
            const chat = model.startChat(messages);
            const result = await chat.sendMessageStream(userMessage);

            messages.history.push({
                role: "user",
                parts: [{ text: userMessage }]
            });

            chatContainer.insertAdjacentHTML(
                "beforeend",
                `<div class="model"><p></p></div>`
            );

            let modelText = "";
            for await (const chunk of result.stream) {
                modelText += chunk.text();
                const replies = chatContainer.querySelectorAll(".model");
                replies[replies.length - 1].querySelector("p").innerHTML =
                    formatChatResponse(modelText);
                scrollToBottom();
            }

            messages.history.push({
                role: "model",
                parts: [{ text: modelText }]
            });

            saveChatHistory();
            maybeGenerateImage(userMessage);
            maybeGenerateVideo(userMessage);

        } else {
            chatContainer.insertAdjacentHTML(
                "beforeend",
                `<div class="offmodel"><p>You're offline. Check your connection.</p></div>`
            );
        }

    } catch (err) {
        console.error("Alyndrik Chat Error:", err);

        // 🔁 Auto-switch on rate limit
        if (err?.status === 429) {
            await handleModelAutoSwitch(true);
            speakNatural("Usage limit reached. Switching to Lite AI model.");
        }

        const fallback = [
            "😴 Oops! Problem processing your message.",
            "👩‍💻 Slight issue with the chat. Please retry.",
            "⚠️ Service busy. Please try again shortly."
        ];

        const randomMessage =
            fallback[Math.floor(Math.random() * fallback.length)];

        chatContainer.insertAdjacentHTML(
            "beforeend",
            `<div class="onmodel">
                <p style="color:red;text-align:center;font-style:italic;">
                    ${randomMessage}
                </p>
            </div>`
        );
    } finally {
        isMessageProcessing = false;
        if (loader) loader.remove();
        scrollToBottom();
    }
}
// ✅ Event Listeners
const sendBtn = document.querySelector(".chat-window .input-area button");
if (sendBtn) sendBtn.addEventListener("click", sendMessage);

const chatBtn = document.querySelector(".chat-button");
if (chatBtn) chatBtn.addEventListener("click", () => {
    document.body.classList.add("chat-open");
    loadChatHistory();
    updateChatControlsState(); // Ensure controls are correctly set when chat opens
});

const closeBtn = document.querySelector(".chat-window button.close");
if (closeBtn) closeBtn.addEventListener("click", () => {
    document.body.classList.remove("chat-open");
});

const deleteBtn = document.getElementById("delete-chat-button");
if (deleteBtn) deleteBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this chat history? This action cannot be undone.")) deleteChatHistory();
});

// NEW: Listen for custom events dispatched by time-tracker.js to update UI
window.addEventListener('trackerBlocked', updateChatControlsState);
window.addEventListener('trackerUnblocked', updateChatControlsState);


// ✅ Initialize on Load
window.addEventListener("load", () => {
    // Attempt to cache update page early (best-effort)
    cacheUpdatePage("https://meang1.blogspot.com/2025/08/alyndrik-chatbot.html").catch(() => {});

    // First enforce offline-safe update check: if offline and minimum required says update => block
    if (!navigator.onLine || enforceUpdateOffline()) {
        // Overlay is shown by enforceUpdateOffline/disableChatbot
        // updateChatControlsState will be called implicitly by disableChatbot
        return;
    }

    loadChatHistory();
    loadSDK().then(() => {
        autoRespondOnReload();
        checkForUpdates(); // This will call enableChatbot/disableChatbot
        // After version check, ensure UI is correctly set based on both version and tracker status
        updateChatControlsState();
    });
});

async function switchGeminiModel(newModelName) {
    if (!modelReady || !genAIInstance) return;

    // Ensure we only allow valid Gemini models
    if (![GEMINI_MODELS.FLASH, GEMINI_MODELS.FLASH_LITE].includes(newModelName)) {
        console.warn("❌ Invalid model name:", newModelName);
        return;
    }

    if (lastNotifiedModel === newModelName) return;

    showToast(`Switching AI model to ${newModelName}...`, "warning");

    try {
        model = genAIInstance.getGenerativeModel({
            model: newModelName,
            systemInstruction: cachedSystemInstruction
        });

        lastNotifiedModel = newModelName;

        updateSystemState({
            model: newModelName,
            usage: newModelName === GEMINI_MODELS.FLASH_LITE ? "high" : "normal"
        });

        const health = runHealthCheck();

        announceSystemMessage(
    {
        popup: "🔄 AI model switched.",
        voice: health.message || "The AI model has been switched successfully."
    },
    { type: "success" }
);
        // Remove or replace 'message' with a valid variable, e.g. newModelName
if (!newModelName) {
    console.warn("⚠️ No model name provided to switchGeminiModel");
    return;
}

        showToast(`Alyndrik model is switched to ${newModelName}`, "success");
        console.log("🎯 Model switched to:", newModelName);

    } catch (err) {
        console.error("❌ Failed to switch model:", err);
        showToast("❌ Failed to switch AI model.", "warning");
    }
}



window.addEventListener("usageLevel", async (e) => {
    console.log("📊 usageLevel event received:", e.detail);

    const usageRatio = e.detail?.ratio ?? 0;

    if (!modelReady) {
        console.warn("⏳ Model not ready yet");
        return;
    }
    if (!genAIInstance || !model) {
        console.warn("❌ genAIInstance or model missing");
        return;
    }
    if (isMessageProcessing) {
        console.warn("⏸ Message processing — switch postponed");
        return;
    }

    console.log("📈 Current usage ratio:", usageRatio);

    if (isModelSwitchRequired(usageRatio)) {
        const targetModel = resolveModelByUsage(usageRatio);
        console.log("🎯 Target model resolved:", targetModel);
        await switchGeminiModel(targetModel);
    } else {
        console.log("✅ No model switch needed");
    }
});

// Periodically check for model auto-switch
//setInterval(() => {
    //handleModelAutoSwitch().catch(err => //console.error("Auto-switch error//:", err));
//}, 3000); // every 3 seconds

window.addEventListener("offline", () => {
    updateSystemState({ online: false });
});

window.addEventListener("online", () => {
    updateSystemState({ online: true });
});
window.addEventListener("alyndrik-health-check", () => {
    const health = runHealthCheck();

    console.log("🩺 Manual Health Check:", health);

    addSystemMessage(health.message);
    speakNatural(health.message);

    showToast("🩺 Alyndrik health check completed", "success");
});
window.addEventListener("online", () => {
    clearTimeout(networkStabilizeTimer);
    networkStabilizeTimer = setTimeout(() => {
        checkNetworkHealth();
    }, 3000);
});


// ✅ Initial Alerts (fixed)
// Removed these `lert` calls as they are not standard and would cause errors or redundant popups.
// If you have a custom 'lert' function, you would need to define it.
// Consider integrating these messages into the chatbot's initial greeting.
// lert("Welcome to Alyndrik Bot.");
// lert("NOTE: Alyndrik Requires an Active internet connection for at least 5 minutes to download its model and cache its SDK, enabling it to function completely offline afterward.");
// lert("Ensure data connection is Turned On.");

// ============================
// 🌟 PWA Install Banner
// ============================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Prevent multiple banners
    if (document.getElementById("install-banner")) return;

    // Create and append banner
    const banner = document.createElement("div");
    banner.id = "install-banner";
    banner.innerHTML = `
      <div id="install-inner">
        <img src="/icons/icon-192.png" alt="Alyndrik Icon">
        <div id="install-text">
          <strong>Alyndrik Lite</strong>
          <span>Install Alyndrik Lite to your device for the Better Experience.</span>
        </div>
        <button id="install-btn">Install</button>
        <span id="install-close">&times;</span>
      </div>
    `;
    document.body.appendChild(banner);

    // Add CSS
    const style = document.createElement("style");
    style.innerHTML = `
      #install-banner {
        position: fixed;
        bottom: env(safe-area-inset-bottom, 16px);
        left: 0;
        right: 0;
        z-index: 99999;
        padding: 0 12px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        animation: slideUp 0.4s ease-out;
        box-sizing: border-box;
      }

      #install-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        background: #ffffff;
        padding: 12px 14px;
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        width: 100%;
        max-width: 520px;
        margin: 0 auto;
        box-sizing: border-box;
      }

      #install-inner img {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        flex-shrink: 0;
      }

      #install-text {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      #install-text strong {
        font-size: 0.95rem;
        color: #222;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      #install-text span {
        font-size: 0.8rem;
        color: #555;
        line-height: 1.2;
      }

      /* === ORIGINAL INSTALL BUTTON STYLE PRESERVED === */
      #install-btn {
        flex-shrink: 0;
        height: 36px;
        padding: 0 16px;
        border-radius: 18px;
        border: none;
        background: #007bff;
        color: #fff;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
      }

      #install-btn:active {
        transform: scale(0.96);
      }

      #install-close {
        flex-shrink: 0;
        font-size: 20px;
        color: #888;
        cursor: pointer;
        padding-left: 4px;
      }

      @media (max-width: 360px) {
        #install-inner {
          flex-wrap: wrap;
          gap: 8px;
        }
        #install-btn {
          width: 100%;
          text-align: center;
        }
        #install-close {
          position: absolute;
          top: 8px;
          right: 14px;
        }
      }

      @keyframes slideUp {
        from { transform: translateY(40px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Event listeners
    document.getElementById("install-btn").addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("Install outcome:", outcome);
        deferredPrompt = null;
        banner.remove();
    });

    document.getElementById("install-close").addEventListener("click", () => {
        banner.remove();
    });
});

window.addEventListener("load", () => {
    // Attach debug helpers safely after page and functions are ready
    window.ALYNDRIK_DEBUG = {
        updateSystemState,
        runHealthCheck,
        speakNatural,
        SystemState,
        switchGeminiModel,
        handleModelAutoSwitch
    };

    window.testAutoSwitch = handleModelAutoSwitch;
    window.getLastNotifiedModel = () => lastNotifiedModel;

    console.log("🧪 Auto-switch test helpers are now available on window");
});

// Example: computes usage ratio from your tracker
function getCurrentUsageRatio() {
    // Here you would compute the ratio based on actual usage counts
    // For now, let's mock it as 0–1 based on isChatTemporarilyBlocked
    if (isChatTemporarilyBlocked()) return 1; // fully blocked -> ratio = 1
    return 0; // not blocked -> ratio = 0
}

// ===============================
// 🔄 Periodic Auto-Switch Check
// ===============================
setInterval(() => {
    if (!modelReady) return;
    const ratio = getCurrentUsageRatio(); // implement from time-tracker
    if (isModelSwitchRequired(ratio)) {
        const targetModel = resolveModelByUsage(ratio);
        handleModelAutoSwitch(true); // force switch if needed
    }
}, 5000);

