// ✅ sw.js — Alyndrik Chatbot (OFFLINE SAFE)
const CACHE_NAME = "yakuwaz-v3";

// Core shell (MUST load offline)
const APP_SHELL = [
  "/",
  "/index.html",
  "/sw.js",
  "/chatbot.js",
  "/chatInfo.js",
  "/pdfInfo.js",
  "/style.css",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Install — cache app shell safely
self.addEventListener("install", event => {
  console.log("🛠️ SW installing...");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of APP_SHELL) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn("⚠️ Failed to cache:", asset);
        }
      }
    })
  );
});

// Activate — cleanup old caches
self.addEventListener("activate", event => {
  console.log("🚀 SW activating...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — OFFLINE FIRST + SPA fallback
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const request = event.request;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          // Cache successful GET responses
          if (response.status === 200 && response.type === "basic") {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // 🔑 CRITICAL: SPA / offline reopen fix
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }

          // PDF fallback
          if (request.url.endsWith(".pdf")) {
            return new Response("⚠️ PDF not available offline.", {
              status: 503,
              headers: { "Content-Type": "text/plain" }
            });
          }
        });
    })
  );
});