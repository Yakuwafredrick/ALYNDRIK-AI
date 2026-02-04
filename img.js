// img-video-gcs.js
// Alyndrik Chatbot – Image & Video via Google Custom Search API (with Offline Cache)

const GOOGLE_API_KEY = "AIzaSyBA7RuLqxCHtvdIN3ViBs6KnBE3E2q4KUY";
const CX = "36c17de7454b54067";
const CACHE_NAME = "alyndrik-media-cache-v1";

// ✅ Helper: Save media URL to cache
async function cacheMedia(url) {
  if (!url) return;
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(url, { mode: "no-cors" });
    await cache.put(url, response);
  } catch (err) {
    console.warn("⚠️ Could not cache media:", err);
  }
}

// ✅ Helper: Retrieve media blob for offline use
async function getCachedMedia(url) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const match = await cache.match(url);
    if (match) {
      console.log("📦 Loaded from cache:", url);
      const blob = await match.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (err) {
    console.error("❌ Cache retrieval failed:", err);
    return null;
  }
}

// ✅ Image Fetcher
export async function fetchImageFromGoogle(query) {
  try {
    if (!navigator.onLine) {
      const stored = localStorage.getItem(`img:${query}`);
      if (stored) {
        const cachedBlob = await getCachedMedia(stored);
        return cachedBlob || stored;
      }
      return "⚠️ Offline. No cached image found for this query.";
    }

    const API_URL = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      query
    )}&cx=${CX}&searchType=image&key=${GOOGLE_API_KEY}&num=1`;
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const imgUrl = data.items[0].link;
      localStorage.setItem(`img:${query}`, imgUrl);
      await cacheMedia(imgUrl);
      return imgUrl;
    }
    return null;
  } catch (err) {
    console.error("❌ Error fetching image:", err);
    return null;
  }
}

// ✅ Append Image to Chat
export async function generateImage(query) {
  const imgUrl = await fetchImageFromGoogle(query);
  if (!imgUrl) return;

  const chatContainer = document.querySelector(".chat-window .chat");

  const mediaHTML = imgUrl.startsWith("⚠️")
    ? `<div class="model"><p>${imgUrl}</p></div>`
    : `<div class="model">
         <img src="${imgUrl}" alt="${query}" style="max-width:100%;border-radius:10px;margin-top:8px;">
       </div>`;

  chatContainer.insertAdjacentHTML("beforeend", mediaHTML);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ✅ Detect Image Prompts
export async function maybeGenerateImage(userMessage) {
  const lower = userMessage.toLowerCase();
  if (["image", "picture", "photo", "draw", "art"].some(k => lower.includes(k))) {
    setTimeout(() => generateImage(userMessage), 1000);
  }
}

// ✅ Video Fetcher
export async function fetchVideoFromGoogle(query) {
  try {
    if (!navigator.onLine) {
      const stored = localStorage.getItem(`vid:${query}`);
      if (stored) {
        const cachedBlob = await getCachedMedia(stored);
        return cachedBlob || stored;
      }
      return "⚠️ Offline. No cached video found for this query.";
    }

    const API_URL = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
      query
    )}&cx=${CX}&searchType=video&key=${GOOGLE_API_KEY}&num=1`;
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const vidUrl = data.items[0].link;
      localStorage.setItem(`vid:${query}`, vidUrl);
      await cacheMedia(vidUrl);
      return vidUrl;
    }
    return null;
  } catch (err) {
    console.error("❌ Error fetching video:", err);
    return null;
  }
}

// ✅ Append Video to Chat
export async function generateVideo(query) {
  const videoUrl = await fetchVideoFromGoogle(query);
  if (!videoUrl) return;

  const chatContainer = document.querySelector(".chat-window .chat");

  const mediaHTML = videoUrl.startsWith("⚠️")
    ? `<div class="model"><p>${videoUrl}</p></div>`
    : `<div class="model">
         <video controls style="max-width:100%;border-radius:10px;margin-top:8px;">
           <source src="${videoUrl}" type="video/mp4">
           Your browser does not support HTML video.
         </video>
       </div>`;

  chatContainer.insertAdjacentHTML("beforeend", mediaHTML);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ✅ Detect Video Prompts
export async function maybeGenerateVideo(userMessage) {
  const lower = userMessage.toLowerCase();
  if (["video", "movie", "clip", "footage", "recording"].some(k => lower.includes(k))) {
    setTimeout(() => generateVideo(userMessage), 1000);
  }
}