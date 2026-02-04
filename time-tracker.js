const MAX_CLICKS = 30;
const WARNING_THRESHOLD = 20;
const BLOCK_DURATION_SECONDS = 43200;//e.g From morning at 6:00 a.m. to Evening at 6:00 p.m. is 12 hours, which is exactly Half a Day. 
const LS_CLICK_COUNT = 'yakuwaz_tracker_click_count';
const LS_BLOCK_END_TIME = 'yakuwaz_tracker_block_end_time';
let blockTimerId = null; // Stores the interval ID for the countdown timer

// Get initial state from localStorage
let currentClickCount = parseInt(localStorage.getItem(LS_CLICK_COUNT) || '0', 10);
let blockEndTime = parseInt(localStorage.getItem(LS_BLOCK_END_TIME) || '0', 10);

// Utility function to get the chat container for message display
function getChatContainer() {
    return document.querySelector(".chat-window .chat");
}

// Function to scroll chat to bottom (utility, similar to AszL14YeuN4zDueR14Ib4K.js)
function scrollToBottom() {
    const chatContainer = getChatContainer();
    if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to display tracker-specific messages within the chat
function displayTrackerMessage(message, isWarning = false) {
    const chatContainer = getChatContainer();
    if (!chatContainer) return;

    // Remove any existing tracker warning/block messages to avoid clutter
    const existingMessages = chatContainer.querySelectorAll('.usage-tracker-message');
    existingMessages.forEach(msg => msg.remove());

    const style = isWarning ? "color: green; font-weight: bold;" : "color: orange; font-weight: bold;";
    chatContainer.insertAdjacentHTML("beforeend",
        `<div class='model usage-tracker-message'><p style="${style} text-align: center; font-style: italic; font-size: 0.9em; margin: 8px 0;"></p></div>`
    );
    const newMessageDiv = chatContainer.querySelector('.usage-tracker-message:last-child p');
    if (newMessageDiv) newMessageDiv.innerHTML = message;
    scrollToBottom();
}

// Clears all tracker messages from the chat UI
function clearTrackerMessages() {
    const chatContainer = getChatContainer();
    if (chatContainer) {
        const existingMessages = chatContainer.querySelectorAll('.usage-tracker-message');
        existingMessages.forEach(msg => msg.remove());
    }
}

// Starts the countdown timer for a temporary block
function startBlockCountdown() {
    if (blockTimerId) {
        clearInterval(blockTimerId); // Clear any existing timer
    }

    blockTimerId = setInterval(() => {
        const now = Date.now();
        const remainingSeconds = Math.ceil((blockEndTime - now) / 1000);

        if (remainingSeconds <= 0) {
            clearInterval(blockTimerId);
            blockTimerId = null;
            unblockUser(); // Unblock when time runs out
            window.dispatchEvent(new Event('trackerUnblocked')); // Notify AszL14YeuN4zDueR14Ib4K.js
        } else {
            // Update message with remaining time
            displayTrackerMessage(`🚫 I'm taking a short Break. I'll be with you in about ${remainingSeconds} seconds.`);
            window.dispatchEvent(new Event('trackerBlocked')); // Notify AszL14YeuN4zDueR14Ib4K.js to keep controls disabled
        }
    }, 1000);
}

// Initiates a temporary block for the user
function blockUser() {
    currentClickCount = 0; // Reset click count when blocked
    blockEndTime = Date.now() + BLOCK_DURATION_SECONDS * 1000;
    localStorage.setItem(LS_CLICK_COUNT, '0');
    localStorage.setItem(LS_BLOCK_END_TIME, blockEndTime.toString());

    displayTrackerMessage(`🛑 You've reached the message limit of ${MAX_CLICKS}. Alyndrik is now blocked for ${BLOCK_DURATION_SECONDS} seconds.`, false);
    startBlockCountdown();
    window.dispatchEvent(new Event('trackerBlocked')); // Notify AszL14YeuN4zDueR14Ib4K.js
}

// Removes the temporary block and resets the tracker state
function unblockUser() {
    currentClickCount = 0;
    blockEndTime = 0;
    localStorage.setItem(LS_CLICK_COUNT, '0');
    localStorage.setItem(LS_BLOCK_END_TIME, '0');

    clearTrackerMessages(); // Clear any lingering block messages
    displayTrackerMessage(`🎉 I am back online! You can send messages again.`, false); // This is a "model" style message.

    if (blockTimerId) {
        clearInterval(blockTimerId);
        blockTimerId = null;
    }
    window.dispatchEvent(new Event('trackerUnblocked')); // Notify AszL14YeuN4zDueR14Ib4K.js
}

/**
 * Checks if the chat is currently blocked by the usage tracker.
 * This function also handles auto-unblocking if the block duration has passed.
 * @returns {boolean} True if the chat is blocked, false otherwise.
 */
export function isChatTemporarilyBlocked() {
    const now = Date.now();
    blockEndTime = parseInt(localStorage.getItem(LS_BLOCK_END_TIME) || '0', 10);

    // If block time has passed, unblock it
    if (blockEndTime !== 0 && blockEndTime <= now) {
        unblockUser(); // This will clear state and dispatch the unblocked event
        return false;
    }
    // If block time is still in the future, it is blocked
    if (blockEndTime > now) {
        // If it's blocked, ensure countdown is running and message is displayed (e.g., on page refresh)
        if (!blockTimerId) {
            displayTrackerMessage(`🚫 Alyndrik is temporarily blocked. Please wait ${Math.ceil((blockEndTime - now) / 1000)} seconds.`);
            startBlockCountdown();
        }
        return true;
    }
    return false; // Not blocked
}

/**
 * Handles an attempt to send a message, incrementing the usage count,
 * displaying warnings, or blocking the user as necessary.
 * @returns {boolean} True if the message should proceed to be sent, false if it's blocked.
 */
export function handleSendMessageAttempt() {
    // If already blocked, just return false. The UI is already disabled and message shown.
    if (isChatTemporarilyBlocked()) {
        console.warn("🚫 Chatbot is temporarily blocked due to usage limits.");
        return false;
    }

    currentClickCount++;
    localStorage.setItem(LS_CLICK_COUNT, currentClickCount.toString());
    console.log(`Send button clicked. Count: ${currentClickCount}`);

    if (currentClickCount >= MAX_CLICKS) {
        blockUser(); // Block the user
        return false; // Prevent message from being sent
    } else if (currentClickCount >= WARNING_THRESHOLD) {
        displayTrackerMessage(`⚠️ Warning: You have ${MAX_CLICKS - currentClickCount} messages left before Alyndrik takes a break!`, true);
    }

    return true; // Allow message to be sent
}

// Initialize on load: Check if currently blocked when page loads
window.addEventListener('load', () => {
    isChatTemporarilyBlocked(); // This will handle checking and potentially starting the timer/unblocking
    // Dispatch an event to ensure AszL14YeuN4zDueR14Ib4K.js correctly sets the UI state based on initial tracker status
    window.dispatchEvent(new Event(isChatTemporarilyBlocked() ? 'trackerBlocked' : 'trackerUnblocked'));
});