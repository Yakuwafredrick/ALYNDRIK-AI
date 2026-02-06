import AlyndrikMemory from "./memory.js";

// ⚡ Function to automatically extract memory from user messages
function autoExtractMemory(userText) {
  const lower = userText.toLowerCase().trim();

  // Remember user's name
  if (lower.startsWith("my name is ")) {
    const name = userText.slice(11).trim();
    if (name) AlyndrikMemory.remember(`User's name is ${name}`, "identity");
  }

  // Remember user's likes/preferences
  if (lower.includes("i like ")) {
    const likes = userText.split("i like ")[1].split(/[.,!]/)[0].trim();
    if (likes) AlyndrikMemory.remember(`User likes ${likes}`, "preference");
  }

  // Remember user's role or profession
  if (lower.includes("i am a ")) {
    const profile = userText.split("i am a ")[1].split(/[.,!]/)[0].trim();
    if (profile) AlyndrikMemory.remember(`User is ${profile}`, "profile");
  }
}

// ⚡ Add message to chat UI
function addMessage(text, isUser = false) {
  const chatContainer = document.getElementById("chat-container");
  const messageDiv = document.createElement("div");
  messageDiv.className = isUser ? "user" : "model";
  messageDiv.innerHTML = `<p>${text}</p>`;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ⚡ Handle user message submission
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1️⃣ Add message to chat UI
  addMessage(userMessage, true);

  // 2️⃣ Auto-extract memory
  autoExtractMemory(userMessage);

  // 3️⃣ Optional: generate bot reply (placeholder)
  const botReply = `You said: "${userMessage}"`; // Replace with AI logic
  addMessage(botReply, false);

  // Clear input
  input.value = "";
});