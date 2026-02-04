import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

/* ===============================
   FIREBASE CONFIG
================================ */
const firebaseConfig = {
  apiKey: "AIzaSyC9fz6MDck-iOESkD5d6rX_aOqz3ESRQeY",
  authDomain: "alyndrik-bee9c.firebaseapp.com",
  projectId: "alyndrik-bee9c",
  storageBucket: "alyndrik-bee9c.firebasestorage.app",
  messagingSenderId: "1065720251519",
  appId: "1:1065720251519:web:1afa7497d3853920e42b4a",
  measurementId: "G-HZN0QY9QSJ"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/* ===============================
   BLOCKING ERROR PAGE
================================ */
function showNotificationBlockedScreen() {
  if (document.getElementById("notification-blocker")) return;

  const blocker = document.createElement("div");
  blocker.id = "notification-blocker";
  blocker.innerHTML = `
    <style>
      #notification-blocker {
        position: fixed;
        inset: 0;
        background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
        color: #fff;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-family: system-ui, sans-serif;
        padding: 20px;
      }
      .nb-card {
        max-width: 420px;
        background: rgba(0,0,0,0.35);
        border-radius: 16px;
        padding: 30px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      }
      .nb-card h1 {
        font-size: 22px;
        margin-bottom: 12px;
      }
      .nb-card p {
        font-size: 15px;
        opacity: 0.9;
        margin-bottom: 18px;
      }
      .nb-card button {
        background: #00e0ff;
        color: #000;
        border: none;
        padding: 12px 18px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 15px;
        font-weight: bold;
      }
      .nb-card button:hover {
        background: #00b8d4;
      }
      .nb-help {
        font-size: 13px;
        opacity: 0.7;
        margin-top: 14px;
      }
    </style>

    <div class="nb-card">
      <h1>🔕 Notifications Required</h1>
      <p>
        Alyndrik <b>cannot continue</b> unless notifications are enabled.<br>
        Notifications are required for messages, alerts, and updates.
      </p>

      <button id="retryNotificationPermission">
        🔔 Enable Notifications
      </button>

      <div class="nb-help">
        If blocked permanently, change the Alyndrik nofications in settings → Alyndrik settings → Notifications → click "Allow"
      </div>
    </div>
  `;

  document.body.appendChild(blocker);

  document
    .getElementById("retryNotificationPermission")
    .addEventListener("click", () => {
      location.reload();
    });
}

/* ===============================
   REMOVE BLOCK SCREEN
================================ */
function removeNotificationBlockedScreen() {
  const blocker = document.getElementById("notification-blocker");
  if (blocker) blocker.remove();
}

/* ===============================
   REQUEST PERMISSION
================================ */
async function initNotifications() {
  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    console.warn("❌ Notifications not granted");
    showNotificationBlockedScreen();
    return;
  }

  removeNotificationBlockedScreen();

  try {
    const token = await getToken(messaging, {
      vapidKey: "eTit0aWTxVq7d5zOV2FxLXYeu0_RHhPxfwProNG_7fM"
    });

    if (token) {
      console.log("✅ FCM Token:", token);
      // TODO: Send token to backend if needed
    } else {
      console.warn("⚠️ No registration token available");
    }
  } catch (err) {
    console.error("❌ Error retrieving token:", err);
  }
}

/* ===============================
   FOREGROUND MESSAGE HANDLER
================================ */
onMessage(messaging, (payload) => {
  console.log("🔔 Foreground push received:", payload);

  if (payload.notification) {
    alert(
      payload.notification.title +
      "\n\n" +
      payload.notification.body
    );
  }
});

/* ===============================
   START
================================ */
initNotifications();