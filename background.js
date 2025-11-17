let _maxListSize = 15;

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "addToKclipboard",
        title: "Add text to Kclipboard",
        contexts: ["selection"]
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "addToKclipboard" && info.selectionText) {
        const selectedText = info.selectionText;
        
        // Add to storage
        chrome.storage.local.get(['list'], (clipboard) => {
            let list = clipboard.list;
            
            if (typeof list === "undefined") {
                list = [];
            }
            
            if (list.length === _maxListSize) {
                list.pop();
            }
            
            // Only add if not already in the list
            if (list.indexOf(selectedText) === -1) {
                list.unshift(selectedText);
            }
            
            chrome.storage.local.set({'list': list}, () => {
                console.log("Text saved from context menu");
            });
        });
    }
});