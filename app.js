import AlyndrikMemory from "./memory.js";

/* ===============================
   🧠 Auto Memory Extraction
================================ */
function autoExtractMemory(userText) {
  const lower = userText.toLowerCase().trim();

  if (lower.startsWith("my name is ")) {
    const name = userText.slice(11).trim();
    if (name) AlyndrikMemory.remember(`User's name is ${name}`, "identity");
  }

  if (lower.includes("i like ")) {
    const likes = userText.split("i like ")[1]?.split(/[.,!]/)[0]?.trim();
    if (likes) AlyndrikMemory.remember(`User likes ${likes}`, "preference");
  }

  if (lower.includes("i am a ")) {
    const profile = userText.split("i am a ")[1]?.split(/[.,!]/)[0]?.trim();
    if (profile) AlyndrikMemory.remember(`User is ${profile}`, "profile");
  }
}

/* ===============================
   🧠 Memory Query Detection
================================ */
function isMemoryQuery(text) {
  const q = text.toLowerCase();
  return (
    q.includes("what do you remember") ||
    q.includes("show memory") ||
    q.includes("what do you know about me") ||
    q === "memory"
  );
}

/* ===============================
   💬 UI Helpers
================================ */
function addMessage(text, isUser = false) {
  const chatContainer = document.querySelector(".chat");
  if (!chatContainer) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = isUser ? "user" : "model";
  messageDiv.innerHTML = `<p>${text}</p>`;

  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

/* ===============================
   🚀 Init
================================ */
window.addEventListener("DOMContentLoaded", () => {
  const input = document.querySelector(".input-area input");
  const sendButton = document.querySelector(".input-area button");

  if (!input || !sendButton) return;

  sendButton.addEventListener("click", handleSend);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  });

  function handleSend() {
    const userMessage = input.value.trim();
    if (!userMessage) return;

    // Show user message only
    addMessage(userMessage, true);

    // If user explicitly asks for memory → show it
    if (isMemoryQuery(userMessage)) {
      const memories = AlyndrikMemory.getAll();

      if (!memories || memories.length === 0) {
        addMessage("I don’t have any stored memory yet.", false);
      } else {
        const formatted = memories
          .map(m => `• ${m.content}`)
          .join("<br>");

        addMessage(`Here’s what I remember:<br>${formatted}`, false);
      }

      input.value = "";
      return;
    }

    // Otherwise: silently extract memory only
    autoExtractMemory(userMessage);

    input.value = "";
  }
});