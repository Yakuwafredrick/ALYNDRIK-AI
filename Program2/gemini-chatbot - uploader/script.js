// ✅ script.js with file preview support

const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const fileUploadInput = document.querySelector("#file-upload");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;
let chatHistory = []; // Memory of conversation

const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
};

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(' ');
  let currentWordIndex = 0;
  const typingInterval = setInterval(() => {
    textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatContainer.innerHTML);
    }
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
  }, 75);
};

const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");
  if (chatHistory.length === 0) {
    chatHistory.push({
      role: "user",
      parts: [{ text: `${finalSystemPrompt}\n\nUser: ${userMessage}` }]
    });
  } else {
    chatHistory.push({
      role: "user",
      parts: [{ text: userMessage }]
    });
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);
    const apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1");
    chatHistory.push({
      role: "model",
      parts: [{ text: apiResponse }]
    });
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <img class="avatar" src="images/Bot.gif" alt="Gemini avatar">
                  <p class="text"></p>
                  <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                  </div>
                </div>
                <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;
  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  generateAPIResponse(incomingMessageDiv);
};

const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;
  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done";
  setTimeout(() => copyButton.innerText = "content_copy", 1000);
};

const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return;
  isResponseGenerating = true;

  const html = `<div class="message-content">
                  <img class="avatar" src="images/user.jpg" alt="User avatar">
                  <p class="text"></p>
                </div>`;
  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatContainer.appendChild(outgoingMessageDiv);

  typingForm.reset();
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight);
  setTimeout(showLoadingAnimation, 500);
};

// ✅ File Upload With Preview and Model Processing
fileUploadInput.addEventListener("change", () => {
  const files = Array.from(fileUploadInput.files);
  if (files.length === 0) return;

  // Set response generation to true immediately as we're preparing data for it
  isResponseGenerating = true;

  files.forEach(file => {
    const fileName = file.name;
    const fileType = file.type;
    const fileUrl = URL.createObjectURL(file);
    let previewHtml = '';

    // Preview handling based on file type
    if (fileType.startsWith("image")) {
      previewHtml = `<img src="${fileUrl}" alt="${fileName}" style="max-width: 200px; border-radius: 8px;">`;
    } else if (fileType.startsWith("video")) {
      previewHtml = `<video src="${fileUrl}" controls style="max-width: 250px; border-radius: 8px;"></video>`;
    } else if (fileType === "application/pdf") {
      previewHtml = `<a href="${fileUrl}" target="_blank">📄 View PDF: <strong>${fileName}</strong></a>`;
    } else if (
      fileName.endsWith(".doc") || fileName.endsWith(".docx") || fileName.endsWith(".txt")
    ) {
      previewHtml = `<p class="text">📄 Uploaded document: <strong>${fileName}</strong></p>`;
    } else {
      previewHtml = `<p class="text">📁 Uploaded file: <strong>${fileName}</strong></p>`;
    }

    // Display preview in outgoing message immediately
    const html = `<div class="message-content">
                    <img class="avatar" src="images/user.jpg" alt="User avatar">
                    <div class="text">${previewHtml}</div>
                  </div>`;
    const outgoingPreviewDiv = createMessageElement(html, "outgoing");
    chatContainer.appendChild(outgoingPreviewDiv);
    chatContainer.scrollTo(0, chatContainer.scrollHeight);

    // Read and prepare content for the model
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result; // This will be text for text files, DataURL for others
      const newChatParts = [];

      // Determine how to add content to chatHistory for the model
      if (fileType.startsWith("text") || fileName.endsWith(".txt")) {
        // For text files, add the raw text content
        newChatParts.push({ text: `Here is the content of the uploaded text file "${fileName}":\n\n${content}` });
      } else if (fileType.startsWith("image")) {
        // For images, add a text prompt AND the inlineData for the image
        newChatParts.push({ text: `User uploaded an image (${fileName}). Please analyze it and describe what you see.` });
        // The 'data' part should be the base64 string without the "data:mimeType;base64," prefix
        newChatParts.push({ inlineData: { mimeType: fileType, data: content.split(',')[1] } });
      } else if (fileType.startsWith("video") || fileType === "application/pdf") {
        // For videos and PDFs, direct content processing by current Gemini models
        // is not available. You would need to use other services (e.g., OCR for PDFs,
        // or video analysis APIs) to extract information before sending it to Gemini.
        newChatParts.push({ text: `User uploaded a file: ${fileName}. Please note that I can only process text and images directly. For this file type, please describe what you want me to do with it, or extract key information for me to analyze.` });
        // Optionally, if you still want to send the base64 data to your backend
        // for custom processing, you can add it, but Gemini won't understand it as-is.
        // newChatParts.push({ inlineData: { mimeType: fileType, data: content.split(',')[1] } });
      } else {
        // Generic handling for other unspecific file types
        newChatParts.push({ text: `User uploaded a file: ${fileName}. Currently, I can only process text and images directly. Could you please describe what you want me to do with this file?` });
      }

      // Push the constructed message to chatHistory.
      // Ensure your finalSystemPrompt is defined globally if used here.
      if (chatHistory.length === 0 && typeof finalSystemPrompt !== 'undefined') {
        chatHistory.push({
          role: "user",
          parts: [{ text: `${finalSystemPrompt}\n\n` }].concat(newChatParts)
        });
      } else {
        chatHistory.push({
          role: "user",
          parts: newChatParts
        });
      }

      // Trigger the response generation after the user's message (including file content) is added
      showLoadingAnimation();
    };

    // Read the file content: as text for text files, as DataURL (base64) for others
    if (fileType.startsWith("text") || fileName.endsWith(".txt")) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file); // This will convert images, videos, PDFs, etc., into base64 strings
    }
  });

  fileUploadInput.value = ''; // Reset file input
});

deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all the chats?")) {
    localStorage.removeItem("saved-chats");
    chatHistory = [];
    loadDataFromLocalstorage();
  }
});

suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat();
});

loadDataFromLocalstorage();


// Pre-loader
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('pre-load').style.display = 'none';
        document.getElementById('container').style.display = 'block';
    }, 20389);
});