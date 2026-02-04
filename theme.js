// Get references to the button and the body element
const themeToggleButton = document.getElementById('theme-toggle-btn');
const body = document.body;


// Function to set the theme based on localStorage
function applyTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-theme');
        themeToggleButton.innerHTML = '☀️ Light Mode'; // Change button text/icon for dark theme
    } else {
        body.classList.remove('dark-theme');
        themeToggleButton.innerHTML = '🌙 Dark Mode'; // Change button text/icon for light theme
    }
}

// Check for a saved theme preference in localStorage when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        // Default to light theme if no preference is saved
        applyTheme('light');
    }
});

// Add an event listener to the button
themeToggleButton.addEventListener('click', () => {
    // Toggle the 'dark-theme' class on the body
    const isDark = body.classList.toggle('dark-theme');

    // Save the user's preference to localStorage
    if (isDark) {
        localStorage.setItem('theme', 'dark');
        themeToggleButton.innerHTML = '☀️ Light Mode'; // Update button for dark theme
    } else {
        localStorage.setItem('theme', 'light');
        themeToggleButton.innerHTML = '🌙 Dark Mode'; // Update button for light theme
    }
});