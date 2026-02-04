/**
 * ============================================================
 * Alyndrik Chatbot – Gemini Model Manager
 * ------------------------------------------------------------
 * Responsibility:
 *  - Decide WHICH Gemini model should be used
 *  - Track current active model
 *  - Provide user-friendly messages on model switching
 *  - Stay SDK-agnostic (NO Google SDK logic here)
 * ============================================================
 */

/* ============================================================
   MODEL DEFINITIONS
   ============================================================ */

export const PRIMARY_MODEL = "gemini-2.5-flash";
export const FALLBACK_MODEL = "gemini-2.5-flash-lite";

/**
 * Usage ratio at which we pre-emptively switch to lite model.
 * Example: 0.8 = 80% usage reached
 */
export const SWITCH_THRESHOLD = 0.8;


/* ============================================================
   INTERNAL STATE
   ============================================================ */

let activeModel = PRIMARY_MODEL;


/* ============================================================
   PUBLIC API
   ============================================================ */

/**
 * Returns the currently active Gemini model name
 */
export function getActiveModel() {
    return activeModel;
}

/**
 * Force-set the active model
 * (Used by main app after SDK re-initialization)
 */
export function setActiveModel(modelName) {
    activeModel = modelName;
}

/**
 * Determines which model SHOULD be used based on usage ratio.
 * @param {number} usageRatio - value between 0 and 1
 * @returns {string} model name
 */
export function resolveModelByUsage(usageRatio) {
    if (usageRatio >= SWITCH_THRESHOLD) {
        return FALLBACK_MODEL;
    }
    return PRIMARY_MODEL;
}

/**
 * Determines whether a model switch is required
 * @param {number} usageRatio
 * @returns {boolean}
 */
export function isModelSwitchRequired(usageRatio) {
    return resolveModelByUsage(usageRatio) !== activeModel;
}

/**
 * Returns a user-friendly explanation message
 * for the given model switch
 */
export function getModelSwitchMessage(modelName) {
    if (modelName === FALLBACK_MODEL) {
        return (
            "⚠️ **High usage detected.**\n\n" +
            "To avoid interruption, Alyndrik has switched to a lighter AI model. " +
            "You can continue chatting normally."
        );
    }

    return (
        "✅ **Usage normalised.**\n\n" +
        "Alyndrik has switched back to the full AI model for the best experience."
    );
}


/* ============================================================
   OPTIONAL HELPERS (Future-proofing)
   ============================================================ */

/**
 * Returns a short label for UI badges (optional)
 */
export function getModelBadgeLabel(modelName = activeModel) {
    return modelName === FALLBACK_MODEL
        ? "Gemini Flash-Lite"
        : "Gemini Flash";
}

/**
 * Safe reset (used on session reset / daily reset)
 */
export function resetModelState() {
    activeModel = PRIMARY_MODEL;
}