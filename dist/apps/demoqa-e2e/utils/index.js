"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addTimeout = addTimeout;
exports.fillInputField = fillInputField;
const MAX_RETRIES = 5;
/**
 * Delays execution for the specified duration.
 * @param ms - Duration in milliseconds.
 */
async function addTimeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Fills an input field, retrying up to MAX_RETRIES times to handle
 * flaky React-controlled inputs that may reset after a single fill.
 * @param inputElement - Locator of the input element.
 * @param value        - Value to fill.
 */
async function fillInputField(inputElement, value) {
    try {
        await inputElement.isEditable();
        for (let i = 0; i < MAX_RETRIES; i++) {
            await inputElement.clear();
            await inputElement.fill(value);
            const currentValue = await inputElement.inputValue();
            if (currentValue === value)
                break;
        }
    }
    catch (error) {
        console.error(`Failed to fill input field: ${error}`);
    }
}
