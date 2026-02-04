document.addEventListener('DOMContentLoaded', () => {
    // Get references to your preloader and main content elements
    const firstPreloader = document.getElementById('pre-load1');
    const secondPreloader = document.getElementById('preloader-overlay');
    const preloaderText = document.getElementById('preloader-text');
    const chatWindow = document.querySelector('.chat-window');

    // --- Initial States (Important!) ---
    // Ensure the second preloader and the chat window are hidden at the start.
    // The first preloader (#pre-load1) should be visible by default in HTML/CSS.
    if (secondPreloader) secondPreloader.style.display = 'none';
    if (chatWindow) chatWindow.style.display = 'none';

    // --- NEW FLAG: Detect if the user has ever successfully loaded while online ---
    // This flag, once true, enables the streamlined loading sequence permanently.
    const hasCompletedInitialOnlineLoad = localStorage.getItem('hasCompletedInitialOnlineLoad') === 'true';

    // --- Define the full set of messages and durations for first-time or offline users ---
    const fullLoadingMessages = [
        "Initializing Alyndrik...",
        "Checking Network Status...",
        "Checking for Update...",
        "Preparing to assist...",
        "Processing data...",
        "Analysing Usage Activity...",
        "Verifying System Quota...",
        "Preparing Internal documents...",
        "Almost ready...",
        "Opening the chat..."
    ];
    const fullMessageDurations = {
        "Initializing Alyndrik...": 10098,
        "Checking Network Status...": 6089,
        "Checking for Update...": 4098,
        "Preparing to assist...": 9288,
        "Processing data...": 2998,
        "Analysing Usage Activity...": 6089,
        "Verifying System Quota...": 7098,
        "Preparing Internal documents...": 8089,
        "Almost ready...": 4198,
        "Opening the chat...": 2989
    };

    // --- Define the streamlined set of messages and durations for users who've been online before ---
    const streamlinedLoadingMessages = [
        "Checking System Quota...",
        "Checking Network Status...",
        "Loading Chat history...",
        "Ready to assist...",
        "Opening the chat..."
    ];
    const streamlinedMessageDurations = {
        "Checking System Quota...": 9000,
        "Checking Network Status...": 1500,
        "Loading Chat history...": 1500,
        "Ready to assist...": 4000,
        "Opening the chat...": 6000
    };

    const defaultInterval = 2500;
    const fadeDuration = 500;

    let messageIndex = 0;
    let messageTimer; // For the second preloader's message cycle

    // --- Asynchronous function to check for a real internet connection ---
    async function checkInternetConnection(timeout = 3000) { // 3 seconds timeout
        const controller = new AbortController();
        const signal = controller.signal;

        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', signal });
            clearTimeout(timeoutId);
            console.log("Internet connection detected! ✅");
            return true;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.warn("Internet check timed out or was aborted. ⚠️ This usually means no connection.");
            } else {
                console.error("No internet connection detected:", error);
            }
            return false;
        }
    }

    // This function manages the fading in/out of messages for the second preloader
    // It now accepts the specific messages and durations to use dynamically
    function startMessageCycleForSecondPreloader(messages, durations) {
        if (messageIndex >= messages.length) {
            // All messages displayed, now hide the second preloader
            if (secondPreloader) {
                secondPreloader.classList.add('hidden'); // Trigger CSS fade-out

                // Wait for the fade-out transition to complete before fully hiding and showing chat
                secondPreloader.addEventListener('transitionend', () => {
                    secondPreloader.style.display = 'none'; // Fully hide it
                    if (chatWindow) {
                        chatWindow.style.display = 'flex'; // Show the main chat window
                        document.body.style.overflow = 'auto'; // Re-enable scrolling on the body
                        // No need to set localStorage flags here, they are handled earlier.
                    }
                }, { once: true });
                clearTimeout(messageTimer);
            }
            return;
        }

        const currentMessageText = messages[messageIndex];
        const currentMessageTotalInterval = durations[currentMessageText] || defaultInterval;

        if (preloaderText) {
            preloaderText.style.opacity = '0';
            preloaderText.style.transform = 'translateY(10px)';
        }

        setTimeout(() => {
            if (preloaderText) {
                preloaderText.textContent = currentMessageText;
                preloaderText.style.opacity = '1';
                preloaderText.style.transform = 'translateY(0)';
            }

            messageIndex++;

            const delayUntilNextCycleStart = Math.max(0, currentMessageTotalInterval - fadeDuration);
            if (messageIndex <= messages.length) {
                messageTimer = setTimeout(() => startMessageCycleForSecondPreloader(messages, durations), delayUntilNextCycleStart);
            }

        }, fadeDuration);
    }

    const firstPreloaderDuration = 3590; // The first preloader always runs for this duration

    // --- Using an Immediately Invoked Async Function Expression (IIAFE) ---
    // This allows us to use 'await' within the DOMContentLoaded callback.
    (async () => {
        // --- Step 1: Display and then hide the first preloader ---
        await new Promise(resolve => {
            setTimeout(() => {
                if (firstPreloader) {
                    firstPreloader.style.display = 'none'; // Hide the first preloader after its fixed duration
                }
                resolve(); // Proceed to the next step
            }, firstPreloaderDuration);
        });

        // --- Step 2: Determine messages for the second preloader based on initial online load status ---
        let finalLoadingMessages = fullLoadingMessages; // Default to full messages
        let finalMessageDurations = fullMessageDurations; // Default to full durations

        if (hasCompletedInitialOnlineLoad) {
            // User has previously loaded while online (the 'lifetime pass' is active!)
            // So, always show the streamlined sequence, even if currently offline.
            finalLoadingMessages = streamlinedLoadingMessages;
            finalMessageDurations = streamlinedMessageDurations;
            console.log("Returning user (previously online): showing streamlined sequence, even if currently offline. 🚀");
        } else {
            // User has NOT previously loaded while online, so we need to check internet now.
            console.log("Checking internet for a potential first-time online load... 🤔");
            const isOnline = await checkInternetConnection();

            if (isOnline) {
                // User is online for the first time, or just got online after being offline.
                // Grant them the 'lifetime pass' now!
                finalLoadingMessages = streamlinedLoadingMessages;
                finalMessageDurations = streamlinedMessageDurations;
                localStorage.setItem('hasCompletedInitialOnlineLoad', 'true'); // Set the flag for future visits!
                console.log("User is online: showing streamlined sequence and marking 'hasCompletedInitialOnlineLoad' for future visits. ✅");
            } else {
                // User is offline, and has not yet achieved an initial online load.
                // They get the full sequence, and the 'lifetime pass' is not granted yet.
                console.log("User is offline and hasn't had an initial online load: showing full sequence. 😥");
            }
        }

        // --- Step 3: Activate and start the second preloader with the determined messages ---
        if (secondPreloader) {
            secondPreloader.style.display = 'flex'; // Make the second preloader visible
            startMessageCycleForSecondPreloader(finalLoadingMessages, finalMessageDurations);
        }
    })();
});