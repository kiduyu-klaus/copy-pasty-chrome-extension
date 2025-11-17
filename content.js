// Store previous clipboard value to detect changes
let _previousData = "";

// Maximum number of clipboard entries to store
let _maxListSize = 15;

// Interval ID for periodic clipboard checks
let time_interval_set = undefined;

/**
 * Reads text from the user's clipboard and checks if it has changed.
 * If new text is detected, it gets saved to chrome.storage.
 */
const readClipboardText = () => {
    console.log("Checking for clipboard changes.....");

    // Request permission first, then read clipboard
    navigator.permissions.query({ name: "clipboard-read" }).then((result) => {
        if (result.state === "granted" || result.state === "prompt") {
            navigator.clipboard.readText()
                .then(clipboardText => {
                    // Only storing non-empty text AND only when text has changed
                    if (clipboardText.length > 0 && clipboardText !== _previousData) {
                        setClipboardText(clipboardText); // Save new clipboard text
                        _previousData = clipboardText;   // Update reference
                    }
                })
                .catch(err => {
                    console.log("Clipboard read error:", err);
                    // Fallback: try using execCommand method
                    tryLegacyClipboardRead();
                });
        }
    }).catch(err => {
        console.log("Permission query error:", err);
        // Try reading anyway
        navigator.clipboard.readText()
            .then(clipboardText => {
                if (clipboardText.length > 0 && clipboardText !== _previousData) {
                    setClipboardText(clipboardText);
                    _previousData = clipboardText;
                }
            })
            .catch(err => console.log("Clipboard access denied:", err));
    });
};

/**
 * Legacy fallback method for reading clipboard
 */
const tryLegacyClipboardRead = () => {
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    
    const successful = document.execCommand('paste');
    if (successful && textarea.value.length > 0 && textarea.value !== _previousData) {
        setClipboardText(textarea.value);
        _previousData = textarea.value;
    }
    
    document.body.removeChild(textarea);
};

/**
 * Saves clipboard text into Chrome local storage.
 * Ensures:
 *  1. List exists
 *  2. Max list size enforced
 *  3. No duplicate entries
 */
const setClipboardText = async (clipText) => {
    chrome.storage.local.get(['list'], clipboard => {
        let { list } = clipboard;

        // Initialize list if empty
        if (typeof list === "undefined")
            list = [];

        // Enforce maximum list size by removing oldest item
        if (list.length === _maxListSize) {
            list.pop();
        }

        // Only insert if this is a new entry
        if (list.indexOf(clipText) === -1)
            list.unshift(clipText); // Add latest text to the top

        // Save updated list back to storage
        chrome.storage.local.set({ 'list': list }, () => console.log("Text Saved"));
    });
};

// ------------------------------------------------------------
// EVENT LISTENERS
// ------------------------------------------------------------

/**
 * When mouse leaves the window, start checking clipboard every 2 seconds.
 * Helps catch clipboard copies done outside the browser window.
 */
window.addEventListener('mouseout', function () {
    if (time_interval_set === undefined)
        time_interval_set = setInterval(readClipboardText, 2000);
});

/**
 * When mouse enters the window, stop periodic clipboard checking.
 * Prevents unnecessary polling.
 */
window.addEventListener('mouseover', function () {
    clearInterval(time_interval_set);
    time_interval_set = undefined;
});

/**
 * Immediately capture text when user copies something inside the page.
 * This is more reliable than reading from clipboard API
 */
window.addEventListener('copy', function (e) {
    // Get the selected text directly from the copy event
    const selectedText = window.getSelection().toString();
    
    if (selectedText.length > 0 && selectedText !== _previousData) {
        setClipboardText(selectedText);
        _previousData = selectedText;
        console.log("Text captured from copy event");
    }
    
    // Also try reading clipboard after a delay as backup
    setTimeout(() => {
        readClipboardText();
    }, 100);
});

/**
 * When the page becomes hidden, stop polling.
 * When visible again, restart periodic clipboard checks.
 */
document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
        clearInterval(time_interval_set);
        time_interval_set = undefined;
    } else {
        if (time_interval_set === undefined)
            time_interval_set = setInterval(readClipboardText, 2000);
    }
});