// script.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get DOM Elements
    // const ageInput = document.getElementById('age'); // Remove old age input reference
    const ageYearsInput = document.getElementById('ageYears'); // New: Years input
    const ageMonthsInput = document.getElementById('ageMonths'); // New: Months input
    const ageDaysInput = document.getElementById('ageDays'); // New: Days input

    const temperatureInput = document.getElementById('temperature');
    const tempLocationSelect = document.getElementById('temp-location');
    const pulseRateInput = document.getElementById('pulseRate');
    const respiratoryRateInput = document.getElementById('respiratoryRate');
    const spo2Input = document.getElementById('spo2');
    const checkStatusBtn = document.getElementById('checkStatusBtn');
    const resultsArea = document.getElementById('results');
    const statusMessage = document.getElementById('statusMessage');
    const recommendationsList = document.getElementById('recommendations');

    // 2. Event Listener for the button
    checkStatusBtn.addEventListener('click', checkHealthStatus);

    // Function to check health status
    function checkHealthStatus() {
        // Clear previous results
        statusMessage.textContent = '';
        recommendationsList.innerHTML = '';
        resultsArea.style.display = 'none';
        resultsArea.style.opacity = '0';
        statusMessage.className = ''; // Remove previous status classes

        // 3. Get Input Values and Basic Validation
        // const age = parseFloat(ageInput.value); // Remove old age parsing

        // New: Parse age inputs, defaulting to 0 if empty
        const ageYears = parseInt(ageYearsInput.value) || 0;
        const ageMonths = parseInt(ageMonthsInput.value) || 0;
        const ageDays = parseInt(ageDaysInput.value) || 0;

        const temperature = parseFloat(temperatureInput.value);
        const tempLocation = tempLocationSelect.value;
        const pulseRate = parseFloat(pulseRateInput.value);
        const respiratoryRate = parseFloat(respiratoryRateInput.value);
        const spo2 = parseFloat(spo2Input.value);

        let isValid = true;
        let validationErrors = [];

        // Validate age inputs
        if (ageYears === 0 && ageMonths === 0 && ageDays === 0) {
            isValid = false;
            validationErrors.push('Please enter a valid age (years, months, or days).');
        } else {
            if (ageYears < 0 || ageYears > 120) {
                isValid = false;
                validationErrors.push('Years must be between 0 and 120.');
            }
            if (ageMonths < 0 || ageMonths > 11) {
                isValid = false;
                validationErrors.push('Months must be between 0 and 11.');
            }
            if (ageDays < 0 || ageDays > 30) { // Assuming max 30 days for simplicity in combination with months
                isValid = false;
                validationErrors.push('Days must be between 0 and 30.');
            }
        }

        // Validate other vital signs
        const inputs = [
            // { value: age, name: 'Age', min: 0, max: 120 }, // Remove old age validation
            { value: temperature, name: 'Body Temperature', min: 30, max: 37.5 },
            { value: pulseRate, name: 'Pulse Rate', min: 30, max: 200 },
            { value: respiratoryRate, name: 'Respiratory Rate', min: 5, max: 60 },
            { value: spo2, name: 'SpO2', min: 70, max: 100 }
        ];

        inputs.forEach(input => {
            if (isNaN(input.value) || input.value === '' || input.value < input.min || input.value > input.max) {
                isValid = false;
                validationErrors.push(`${input.name} must be a valid number between ${input.min} and ${input.max}.`);
            }
        });

        if (!isValid) {
            statusMessage.textContent = 'Please correct the following input errors:';
            statusMessage.classList.add('critical'); // Use critical class for validation errors
            validationErrors.forEach(error => {
                const li = document.createElement('li');
                li.textContent = error;
                recommendationsList.appendChild(li);
            });
            displayResults();
            return; // Stop execution if validation fails
        }

        // 4. Define Health Ranges (Simplified for demonstration)
        // Note: Actual medical ranges vary significantly by age, gender, medical history, etc.
        // These are general guidelines.
        // IMPORTANT: For `isAdult` check, we'll primarily use `ageYears` to align with the simplified ranges.
        // A more robust system would require specific ranges for neonates, infants, toddlers, children, adolescents, etc.
        let isAdult = ageYears >= 18;

        const ranges = {
            temperature: {
                normal: { min: 36.1, max: 37.2 },
                fever: { min: 37.3, max: 38.0 }, // Low-grade fever
                highFever: { min: 38.1, max: 40.0 }, // High fever
                hypothermia: { min: 30.0, max: 35.0 } // Severe hypothermia
            },
            pulseRate: isAdult ?
                { normal: { min: 60, max: 100 }, low: { max: 59 }, high: { min: 101 } } : // Adult
                { normal: { min: 70, max: 120 }, low: { max: 69 }, high: { min: 121 } }, // Child (simplified for 1-12 years, also applies to younger if isAdult is false)
            respiratoryRate: isAdult ?
                { normal: { min: 12, max: 20 }, low: { max: 11 }, high: { min: 21 } } : // Adult
                { normal: { min: 18, max: 30 }, low: { max: 17 }, high: { min: 31 } }, // Child (simplified for 1-12 years, also applies to younger if isAdult is false)
            spo2: {
                normal: { min: 95, max: 100 },
                mildHypoxemia: { min: 90, max: 94 },
                severeHypoxemia: { min: 70, max: 89 }
            }
        };

        let overallStatus = 'Normal';
        let recs = [];

        // Generate descriptive age string for results
        let ageDescription = '';
        if (ageYears > 0) {
            ageDescription += `${ageYears} year${ageYears > 1 ? 's' : ''}`;
        }
        if (ageMonths > 0) {
            ageDescription += (ageDescription ? ', ' : '') + `${ageMonths} month${ageMonths > 1 ? 's' : ''}`;
        }
        if (ageDays > 0) {
            ageDescription += (ageDescription ? ', ' : '') + `${ageDays} day${ageDays > 1 ? 's' : ''}`;
        }

        // Add a recommendation specific to age ranges if the patient is an infant/child based on input
        if (ageYears === 0 && (ageMonths > 0 || ageDays > 0)) {
            recs.push(`Please note: For infants and young children (${ageDescription}), vital sign ranges are highly specific. The "child" ranges used here are a simplification. Consult a healthcare professional for accurate assessment.`);
            if (overallStatus === 'Normal') overallStatus = 'Warning'; // Elevate status if this is a critical info point
            statusMessage.classList.add('warning');
        }


        // 5. Calculate Health Status and Generate Recommendations

        // Temperature
        if (temperature >= ranges.temperature.hypothermia.min && temperature <= ranges.temperature.hypothermia.max) {
            recs.push(`Body Temperature (${temperature}°C) is low. This indicates hypothermia. Seek immediate medical attention.`);
            overallStatus = 'Critical';
            statusMessage.classList.add('critical');
        } else if (temperature >= ranges.temperature.highFever.min && temperature <= ranges.temperature.highFever.max) {
            recs.push(`Body Temperature (${temperature}°C) is high. This indicates a high fever. Consider fever-reducing medication and consult a doctor.`);
            if (overallStatus !== 'Critical') overallStatus = 'Warning';
            statusMessage.classList.add('warning');
        } else if (temperature >= ranges.temperature.fever.min && temperature <= ranges.temperature.fever.max) {
            recs.push(`Body Temperature (${temperature}°C) is slightly elevated. Monitor closely and rest.`);
            if (overallStatus === 'Normal') overallStatus = 'Warning';
            statusMessage.classList.add('warning');
        } else if (temperature < ranges.temperature.normal.min) {
            recs.push(`Body Temperature (${temperature}°C) is slightly below normal. Keep warm.`);
            if (overallStatus === 'Normal') overallStatus = 'Warning';
            statusMessage.classList.add('warning');
        } else {
            recs.push(`Body Temperature (${temperature}°C) is within normal range.`);
        }

        // Pulse Rate
        if (pulseRate < ranges.pulseRate.low.max) {
            recs.push(`Pulse Rate (${pulseRate} bpm) is low. Consult a healthcare professional.`);
            if (overallStatus !== 'Critical') overallStatus = 'Warning';
            statusMessage.classList.add('warning');
        } else if (pulseRate > ranges.pulseRate.high.min) {
            recs.push(`Pulse Rate (${pulseRate} bpm) is high. Rest and consider medical advice.`);
            if (overallStatus !== 'Critical') overallStatus = 'Warning';
            statusMessage.classList.add('warning');
        } else {
            recs.push(`Pulse Rate (${pulseRate} bpm) is within normal range.`);
        }

        // Respiratory Rate
        if (respiratoryRate < ranges.respiratoryRate.low.max) {
            recs.push(`Respiratory Rate (${respiratoryRate} breaths/min) is low. Seek medical advice.`);
            if (overallStatus !== 'Critical') overallStatus = 'Warning';
            statusMessage.classList.add('warning');
        } else if (respiratoryRate > ranges.respiratoryRate.high.min) {
            recs.push(`Respiratory Rate (${respiratoryRate} breaths/min) is high. Monitor breathing and consider medical consultation.`);
            if (overallStatus !== 'Critical') overallStatus = 'Warning';
            statusMessage.classList.add('warning');
        } else {
            recs.push(`Respiratory Rate (${respiratoryRate} breaths/min) is within normal range.`);
        }

        // SpO2
        if (spo2 >= ranges.spo2.mildHypoxemia.min && spo2 <= ranges.spo2.mildHypoxemia.max) {
            recs.push(`SpO2 (${spo2}%) is slightly low (mild hypoxemia). Monitor closely and consider medical advice.`);
            if (overallStatus !== 'Critical') overallStatus = 'Warning';
            statusMessage.classList.add('warning');
        } else if (spo2 >= ranges.spo2.severeHypoxemia.min && spo2 <= ranges.spo2.severeHypoxemia.max) {
            recs.push(`SpO2 (${spo2}%) is critically low (severe hypoxemia). Seek immediate medical attention.`);
            overallStatus = 'Critical';
            statusMessage.classList.add('critical');
        } else if (spo2 < ranges.spo2.severeHypoxemia.min) { // Below minimum valid input
            recs.push(`SpO2 (${spo2}%) is extremely low. This is a critical situation. Seek immediate emergency medical care.`);
            overallStatus = 'Critical';
            statusMessage.classList.add('critical');
        }
        else {
            recs.push(`SpO2 (${spo2}%) is within normal range.`);
        }

        // 6. Display Results
        statusMessage.textContent = `Overall Health Status: ${overallStatus}`;
        if (recs.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'All vital signs are within normal ranges. Keep up the good work!';
            recommendationsList.appendChild(li);
        } else {
            recs.forEach(rec => {
                const li = document.createElement('li');
                li.textContent = rec;
                recommendationsList.appendChild(li);
            });
        }
        displayResults();
    }

    // Function to show results area with a fade-in effect
    function displayResults() {
        resultsArea.style.display = 'block';
        setTimeout(() => {
            resultsArea.style.opacity = '1';
        }, 50); // Small delay to allow 'display: block' to render before opacity transition
    }
});

// Pre-loader
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('pre-load').style.display = 'none';
        document.getElementById('container').style.display = 'block';
    }, 16000);
});
