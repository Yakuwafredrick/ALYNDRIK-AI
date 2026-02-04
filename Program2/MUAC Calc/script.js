document.addEventListener('DOMContentLoaded', () => {
    // Get references to HTML elements
    const muacInput = document.getElementById('muac');
    const heightInput = document.getElementById('height');
    const ageInput = document.getElementById('age');
    const genderSelect = document.getElementById('gender');
    const calculateBtn = document.getElementById('calculateBtn');
    const clearBtn = document.getElementById('clearBtn');

    const muacStatusDiv = document.getElementById('muacStatus');
    const heightStatusDiv = document.getElementById('heightStatus');
    const overallStatusDiv = document.getElementById('overallStatus');
    const additionalInfoDiv = document.getElementById('additionalInfo');

    // Helper function to reset and hide all status messages
    function resetStatusMessages() {
        [muacStatusDiv, heightStatusDiv, overallStatusDiv, additionalInfoDiv].forEach(div => {
            div.textContent = '';
            div.className = (div === overallStatusDiv) ? 'overall-status' : 'status-message'; // Reset classes
            div.style.display = 'none';
        });
    }

    // Helper function to display a message in a specific element with styling
    function displayMessage(element, message, type) {
        element.textContent = message;
        element.className = (element === overallStatusDiv) ? `overall-status ${type}` : `status-message ${type}`;
        element.style.display = 'block';
    }

    // --- Core Calculation Logic ---
    // NOTE FOR KATO GERALD:
    // In a real medical application, MUAC-for-age/height Z-scores and Height-for-age Z-scores
    // require extensive WHO growth tables. For this educational example, we use:
    // 1. Standard MUAC cut-offs (WHO recommended for 6-59 months).
    // 2. A simplified, illustrative Z-score calculation for Height-for-Age (HAZ) using hypothetical median/SD values.
    //    These hypothetical values are NOT clinically accurate and serve only to demonstrate the Z-score calculation formula.
    //    HAZ is used to identify stunting (chronic malnutrition).

    // Hypothetical WHO-like data for Height-for-Age Z-score (HAZ)
    // In reality, this would be a large lookup table based on specific age and gender, derived from WHO standards.
    // We're using very rough illustrative medians and SDs for demonstration.
    const HAZ_REFERENCE_DATA = {
        'male': {
            '6-11': { median: 70, sd: 3 },    // Hypothetical for 6-11 months
            '12-23': { median: 78, sd: 3.5 }, // Hypothetical for 12-23 months
            '24-35': { median: 88, sd: 4 },   // Hypothetical for 24-35 months
            '36-47': { median: 96, sd: 4.5 }, // Hypothetical for 36-47 months
            '48-59': { median: 102, sd: 5 }   // Hypothetical for 48-59 months
        },
        'female': {
            '6-11': { median: 68, sd: 2.8 },
            '12-23': { median: 76, sd: 3.2 },
            '24-35': { median: 86, sd: 3.8 },
            '36-47': { median: 94, sd: 4.3 },
            '48-59': { median: 100, sd: 4.8 }
        }
    };

    // Function to calculate Height-for-Age Z-score (HAZ) using our simplified data
    function calculateHAZZScore(heightCm, ageMonths, gender) {
        if (!gender || ageMonths < 1 || !heightCm) return null;

        let ageGroup = '';
        if (ageMonths >= 6 && ageMonths <= 11) ageGroup = '6-11';
        else if (ageMonths >= 12 && ageMonths <= 23) ageGroup = '12-23';
        else if (ageMonths >= 24 && ageMonths <= 35) ageGroup = '24-35';
        else if (ageMonths >= 36 && ageMonths <= 47) ageGroup = '36-47';
        else if (ageMonths >= 48 && ageMonths <= 59) ageGroup = '48-59';
        else return null; // Age not in defined range for this simplified data

        const ref = HAZ_REFERENCE_DATA[gender]?.[ageGroup];

        if (ref) {
            // Z-score formula: (Observed Value - Median Value) / Standard Deviation
            const zScore = (heightCm - ref.median) / ref.sd;
            return parseFloat(zScore.toFixed(2)); // Return with 2 decimal places
        }
        return null; // No reference data found for the given age/gender
    }

    // Event listener for the "Calculate" button
    calculateBtn.addEventListener('click', () => {
        resetStatusMessages(); // Clear previous results

        // Get input values
        const muac = parseFloat(muacInput.value);
        const height = parseFloat(heightInput.value);
        const age = parseInt(ageInput.value);
        const gender = genderSelect.value;

        // --- Input Validation ---
        if (isNaN(muac) || muac <= 0) {
            alert('Please enter a valid positive MUAC value (e.g., 12.0).');
            muacInput.focus();
            return;
        }
        if (isNaN(height) || height <= 0) {
            alert('Please enter a valid positive Height value (e.g., 85.0).');
            heightInput.focus();
            return;
        }
        if (isNaN(age) || age < 1 || age > 59) {
            alert('Please enter a valid age in months (1-59 for this example. MUAC screening usually applies for 6-59 months).');
            ageInput.focus();
            return;
        }
        if (!gender) {
            alert('Please select the gender.');
            genderSelect.focus();
            return;
        }

        // --- MUAC Classification (for children 6-59 months) ---
        let muacClassification = 'Not applicable/Normal for MUAC screening';
        let muacType = 'normal'; // Default type for styling
        let muacInfo = '';

        if (age >= 6 && age <= 59) { // MUAC cut-offs are primarily for children 6-59 months
            if (muac < 11.5) {
                muacClassification = 'Severe Acute Malnutrition (SAM)';
                muacType = 'sam';
                muacInfo = 'MUAC < 11.5 cm is indicative of SAM (Severe Acute Malnutrition) in children 6-59 months.';
            } else if (muac >= 11.5 && muac < 12.5) {
                muacClassification = 'Moderate Acute Malnutrition (MAM)';
                muacType = 'mam';
                muacInfo = 'MUAC between 11.5 cm and < 12.5 cm is indicative of MAM (Moderate Acute Malnutrition) in children 6-59 months.';
            } else {
                muacClassification = 'Normal (MUAC)';
                muacType = 'normal';
                muacInfo = 'MUAC ≥ 12.5 cm is indicative of normal nutritional status by MUAC in children 6-59 months.';
            }
        } else {
            muacInfo = 'MUAC cut-offs are primarily used for children aged 6 to 59 months; status for this age is not directly classified by MUAC alone in this tool.';
        }
        displayMessage(muacStatusDiv, `MUAC Status: ${muacClassification}`, muacType);


        // --- Height-for-Age Z-score (HAZ) Classification (for stunting) ---
        let heightClassification = 'Normal (Height-for-Age)';
        let heightType = 'normal';
        const hazZScore = calculateHAZZScore(height, age, gender);
        let heightInfo = '';

        if (hazZScore !== null) {
            if (hazZScore < -3) {
                heightClassification = 'Severe Stunting';
                heightType = 'sam'; // Using 'sam' style for severe stunting
                heightInfo = `HAZ Z-score: ${hazZScore.toFixed(2)}. This indicates Severe Stunting (very low height for age).`;
            } else if (hazZScore >= -3 && hazZScore < -2) {
                heightClassification = 'Moderate Stunting';
                heightType = 'mam'; // Using 'mam' style for moderate stunting
                heightInfo = `HAZ Z-score: ${hazZScore.toFixed(2)}. This indicates Moderate Stunting (low height for age).`;
            } else {
                heightClassification = 'Normal (Height-for-Age)';
                heightType = 'normal';
                heightInfo = `HAZ Z-score: ${hazZScore.toFixed(2)}. This indicates normal height-for-age.`;
            }
            displayMessage(heightStatusDiv, `Height-for-Age Status: ${heightClassification}`, heightType);
        } else {
            displayMessage(heightStatusDiv, `Height-for-Age Z-score: Not calculable for provided age/gender with this simplified data.`, 'normal');
            heightInfo = `Height-for-Age Z-score calculation with these simplified reference data is not available for age ${age} months or gender ${gender}. Please note a real system would have full WHO tables.`;
        }

        // --- Overall Status (Prioritizing acute malnutrition from MUAC) ---
        let overallStatus = 'Normal Nutritional Status';
        let overallType = 'normal';
        let overallAdditional = '';

        // Prioritize SAM/MAM based on MUAC for acute malnutrition assessment
        if (muacType === 'sam') {
            overallStatus = 'Severe Acute Malnutrition (SAM)';
            overallType = 'sam';
            overallAdditional = 'Immediate medical attention and specialized nutritional support are highly recommended. MUAC is a critical indicator for acute malnutrition. Further assessment for stunting may also be needed.';
        } else if (muacType === 'mam') {
            overallStatus = 'Moderate Acute Malnutrition (MAM)';
            overallType = 'mam';
            overallAdditional = 'Further assessment and supplementary feeding programs may be required. Monitor closely. Consider additional assessment for stunting.';
        } else if (heightType === 'sam') {
            // If MUAC is normal but severe stunting is present
            overallStatus = `Severe Stunting Detected`;
            overallType = 'sam'; // Using 'sam' for severe chronic condition
            overallAdditional = `The child exhibits Severe Stunting. This indicates chronic malnutrition, which can have long-term health consequences. Nutritional assessment and interventions are crucial.`;
        } else if (heightType === 'mam') {
            // If MUAC is normal but moderate stunting is present
            overallStatus = `Moderate Stunting Detected`;
            overallType = 'mam'; // Using 'mam' for moderate chronic condition
            overallAdditional = `The child exhibits Moderate Stunting. This indicates chronic malnutrition. Further dietary and health assessment is recommended.`;
        } else {
             overallStatus = 'Normal Nutritional Status';
             overallType = 'normal';
             overallAdditional = 'The child appears to have a normal nutritional status based on the provided measurements. Continue healthy feeding practices and regular monitoring.';
        }

        displayMessage(overallStatusDiv, `Overall Assessment: ${overallStatus}`, overallType);
        additionalInfoDiv.innerHTML = `
            <strong>MUAC Info:</strong> ${muacInfo}<br>
            <strong>Height-for-Age Info:</strong> ${heightInfo}<br><br>
            <strong>Recommendation:</strong> ${overallAdditional}
        `;
        additionalInfoDiv.style.display = 'block';

        // Scroll the view to the results section for better UX on smaller screens
        overallStatusDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // Event listener for the "Clear" button
    clearBtn.addEventListener('click', () => {
        muacInput.value = '';
        heightInput.value = '';
        ageInput.value = '';
        genderSelect.value = '';
        resetStatusMessages(); // Clear results display
    });
});

// Pre-loader
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('pre-load').style.display = 'none';
        document.getElementById('container').style.display = 'block';
    }, 7100);
});