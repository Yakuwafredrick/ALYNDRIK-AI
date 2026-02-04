// Get DOM elements
const clockDisplay = document.getElementById('clockDisplay');
const alarmTimeInput = document.getElementById('alarmTimeInput');
const alarmMessageInput = document.getElementById('alarmMessageInput');
const setAlarmButton = document.getElementById('setAlarmButton');
const activeAlarmsList = document.getElementById('activeAlarmsList');
const alarmSound = document.getElementById('alarmSound');

// NEW: Alarm Dialog elements
const alarmDialog = document.getElementById('alarmDialog');
const alarmDialogMessage = document.getElementById('alarmDialogMessage');
const snoozeButton = document.getElementById('snoozeButton');
const dismissButton = document.getElementById('dismissButton');

let alarms = []; // Array to store active alarms
let currentRingingAlarmId = null; // To track which alarm is currently ringing
let alarmSoundTimeout = null; // To stop sound after an auto-timeout if no interaction

// --- Local Storage Functions ---
function loadAlarms() {
    const storedAlarms = localStorage.getItem('medicalAlarms');
    if (storedAlarms) {
        // Parse the JSON string back into an array
        // Ensure 'triggered' flag is reset on load so alarms can re-trigger daily
        alarms = JSON.parse(storedAlarms).map(alarm => ({ ...alarm, triggered: false }));
    }
    renderAlarms(); // Display loaded alarms
}

function saveAlarms() {
    // Convert the alarms array to a JSON string before saving
    localStorage.setItem('medicalAlarms', JSON.stringify(alarms));
}

// --- Clock and Alarm Checking Logic ---
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;

    checkAlarms(hours, minutes);
}

function checkAlarms(currentHours, currentMinutes) {
    alarms.forEach((alarm) => {
        // If this alarm is already ringing and its dialog is open, don't re-trigger it
        if (alarm.id === currentRingingAlarmId) {
            return;
        }

        const [alarmH, alarmM] = alarm.time.split(':').map(Number);

        // Check if alarm time matches current time and hasn't been triggered yet
        if (alarmH === Number(currentHours) && alarmM === Number(currentMinutes) && !alarm.triggered) {
            triggerAlarm(alarm.message, alarm.id);
            alarm.triggered = true; // Mark as triggered for this minute/cycle
        }
    });
}

// --- Alarm Interaction Functions (Trigger, Snooze, Dismiss) ---

function triggerAlarm(message, alarmId) {
    // Ensure only one alarm is ringing at a time
    if (currentRingingAlarmId !== null) {
        // If another alarm is ringing, dismiss it before showing a new one
        dismissAlarm();
    }

    currentRingingAlarmId = alarmId;
    alarmDialogMessage.textContent = message;
    alarmDialog.classList.add('show'); // Show the dialog

    alarmSound.play(); // Play the sound (now with 'loop' attribute in HTML)

    // Automatically dismiss the alarm after 60 seconds if no action is taken
    // This prevents the sound from playing indefinitely
    alarmSoundTimeout = setTimeout(() => {
        console.log('Alarm auto-dismissed after 60 seconds.');
        dismissAlarm();
    }, 60000); // Auto-dismiss after 60 seconds
}

function stopAlarmSoundAndUI() {
    alarmSound.pause();
    alarmSound.currentTime = 0; // Reset sound to beginning
    alarmDialog.classList.remove('show'); // Hide the dialog

    if (alarmSoundTimeout) {
        clearTimeout(alarmSoundTimeout); // Clear auto-dismiss timeout
        alarmSoundTimeout = null;
    }
    currentRingingAlarmId = null; // No alarm currently ringing
}

function snoozeAlarm() {
    if (currentRingingAlarmId === null) return; // No alarm to snooze

    const snoozedAlarm = alarms.find(a => a.id === currentRingingAlarmId);
    if (!snoozedAlarm) return;

    stopAlarmSoundAndUI(); // Stop current sound and hide UI

    const now = new Date();
    const snoozeMinutes = 5; // Snooze duration in minutes
    now.setMinutes(now.getMinutes() + snoozeMinutes);

    const snoozedHours = String(now.getHours()).padStart(2, '0');
    const snoozedMinutes = String(now.getMinutes()).padStart(2, '0');

    // Create a NEW temporary alarm for the snooze
    const newSnoozeAlarm = {
        time: `${snoozedHours}:${snoozedMinutes}`,
        message: `${snoozedAlarm.message} (Snoozed)`,
        id: Date.now(), // A new unique ID
        triggered: false // Ready to trigger
    };
    alarms.push(newSnoozeAlarm);
    saveAlarms();
    renderAlarms(); // Update the list to show the snoozed alarm

    console.log(`Alarm snoozed. Will ring again at ${newSnoozeAlarm.time}`);
}

function dismissAlarm() {
    if (currentRingingAlarmId === null) return; // No alarm to dismiss

    const dismissedAlarm = alarms.find(a => a.id === currentRingingAlarmId);
    if (dismissedAlarm) {
        // For a medical reminder, we generally want it to trigger again the next day.
        // The `alarm.triggered = false` in `setInterval` will handle this for daily recurrence.
        // So here, we just stop the current alert.
        console.log(`Alarm dismissed: ${dismissedAlarm.message}`);
    }

    stopAlarmSoundAndUI();
}

// --- Alarm Management (Add/Render/Remove) ---
function addAlarm() {
    const alarmTime = alarmTimeInput.value;
    const alarmMessage = alarmMessageInput.value.trim();

    if (!alarmTime) {
        alert('Please select a time for the alarm!');
        return;
    }
    if (!alarmMessage) {
        alert('Please enter a message for the alarm!');
        return;
    }

    // Check for duplicate times, useful for medical reminders
    if (alarms.some(alarm => alarm.time === alarmTime && alarm.message === alarmMessage)) {
        alert('An identical alarm is already set for this time and message.');
        return;
    }

    const newAlarm = {
        time: alarmTime,
        message: alarmMessage,
        id: Date.now(), // Unique ID for each alarm
        triggered: false // Flag to prevent repeated triggering in the same minute
    };

    alarms.push(newAlarm);
    saveAlarms();
    renderAlarms();
    alarmTimeInput.value = '';
    alarmMessageInput.value = '';
}

function renderAlarms() {
    activeAlarmsList.innerHTML = ''; // Clear current list

    alarms.sort((a, b) => a.time.localeCompare(b.time)); // Sort by time

    if (alarms.length === 0) {
        activeAlarmsList.innerHTML = '<li>No alarms set.</li>';
        return;
    }

    alarms.forEach(alarm => {
        const listItem = document.createElement('li');
        listItem.dataset.id = alarm.id; // Store ID for easy removal
        listItem.innerHTML = `
            <span>${alarm.time} - ${alarm.message}</span>
            <button class="delete-alarm-btn">Delete</button>
        `;
        activeAlarmsList.appendChild(listItem);
    });

    document.querySelectorAll('.delete-alarm-btn').forEach(button => {
        button.onclick = (event) => {
            const alarmIdToDelete = Number(event.target.closest('li').dataset.id);
            removeAlarm(alarmIdToDelete);
        };
    });
}

function removeAlarm(id) {
    alarms = alarms.filter(alarm => alarm.id !== id);
    saveAlarms();
    renderAlarms();
}

// --- Event Listeners and Initial Setup ---
setAlarmButton.addEventListener('click', addAlarm);
snoozeButton.addEventListener('click', snoozeAlarm); // NEW
dismissButton.addEventListener('click', dismissAlarm); // NEW

loadAlarms();
updateClock(); // Initial call to update the clock immediately

// Update the clock every second and reset 'triggered' flag at new minute
setInterval(() => {
    updateClock();
    const now = new Date();
    // Reset the 'triggered' flag for all alarms at the *start of each new minute*.
    // This allows daily re-triggering for persistent alarms.
    if (now.getSeconds() === 0) {
        alarms.forEach(alarm => alarm.triggered = false);
    }
}, 1000);


// Pre-loader
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('pre-load').style.display = 'none';
        document.getElementById('container').style.display = 'block';
    }, 4000);
});
