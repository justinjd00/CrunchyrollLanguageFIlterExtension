const episodesInput = document.getElementById('episodes');
const ratingInput = document.getElementById('rating');
const dubLanguagesDiv = document.getElementById('dubLanguages');
const applyButton = document.getElementById('applyButton');
const clearButton = document.getElementById('clearButton');
const statusMessageDiv = document.getElementById('statusMessage');

function loadFilters() {
    chrome.storage.local.get(['filters'], (result) => {
        if (result.filters) {
            console.log("Loading saved filters:", result.filters);
            if (episodesInput) episodesInput.value = result.filters.episodes || '';
            if (ratingInput) ratingInput.value = result.filters.rating || '';

            const savedDubLangs = result.filters.selectedDubLanguages || [];
            if (dubLanguagesDiv) {
                dubLanguagesDiv.querySelectorAll('input[name="dubLang"]').forEach(checkbox => {
                    checkbox.checked = savedDubLangs.includes(checkbox.value);
                });
            }
        } else {
            console.log("No saved filters found.");
        }
    });
}

function saveFilters(filters) {
    chrome.storage.local.set({ filters: filters }, () => {
        console.log('Filters saved:', filters);
    });
}

function showStatusMessage(message, isError = false) {
    if (statusMessageDiv) {
        statusMessageDiv.textContent = message;
        statusMessageDiv.style.color = isError ? '#d9534f' : '#555';
        setTimeout(() => {
            if (statusMessageDiv.textContent === message) {
                statusMessageDiv.textContent = '';
            }
        }, 4000);
    } else {
        console.log("Status:", message);
    }
}

if (applyButton) {
    applyButton.addEventListener('click', () => {
        let selectedDubLanguages = [];
        if (dubLanguagesDiv) {
            selectedDubLanguages = Array.from(dubLanguagesDiv.querySelectorAll('input[name="dubLang"]:checked'))
                .map(checkbox => checkbox.value);
        }

        const filters = {
            episodes: episodesInput ? episodesInput.value.trim() : '',
            rating: ratingInput ? ratingInput.value.trim() : '',
            selectedDubLanguages: selectedDubLanguages,
        };

        if (filters.episodes && isNaN(parseInt(filters.episodes))) {
            showStatusMessage("Invalid Min Episodes.", true);
            return;
        }
        if (filters.rating && isNaN(parseFloat(filters.rating))) {
            showStatusMessage("Invalid Min Rating.", true);
            return;
        }
        const ratingVal = parseFloat(filters.rating);
        if (filters.rating && (ratingVal < 0 || ratingVal > 5)) {
            showStatusMessage("Rating must be between 0 and 5.", true);
            return;
        }

        console.log("Sending filters:", filters);
        showStatusMessage("Applying filters...");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0 || !tabs[0].id) {
                console.error("Could not find active tab ID.");
                showStatusMessage("Error: Could not find active tab.", true);
                return;
            }

            if (!tabs[0].url || !tabs[0].url.includes('crunchyroll.com')) {
                showStatusMessage("Error: Not on a Crunchyroll page.", true);
                console.warn("Attempted to apply filters on a non-Crunchyroll page:", tabs[0].url);
                return;
            }

            const tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { action: 'applyFilters', filters: filters }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(`Error sending message to tab ${tabId}:`, chrome.runtime.lastError.message);
                    if (chrome.runtime.lastError.message.includes("Could not establish connection") || chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
                        showStatusMessage("Error: Cannot connect to page. Try refreshing.", true);
                    } else {
                        showStatusMessage(`Error: ${chrome.runtime.lastError.message}`, true);
                    }
                } else if (response && response.status === "Filters applied") {
                    console.log("Content script applied filters.", response);
                    showStatusMessage(`Filters applied (${response.visibleCount}/${response.totalCount} shown).`);
                    saveFilters(filters);
                } else if (response && response.status) {
                    console.warn("Received response from content script:", response);
                    showStatusMessage(`Status: ${response.status}`, response.status.includes("Error"));
                } else {
                    console.warn("Received no or unexpected response from content script.");
                    showStatusMessage("No response from page. Filters might be applying.", true);
                }
            });
        });
    });
} else {
    console.error("Apply button not found!");
}

if (clearButton) {
    clearButton.addEventListener('click', () => {
        console.log("Clearing filters...");
        if (episodesInput) episodesInput.value = '';
        if (ratingInput) ratingInput.value = '';
        if (dubLanguagesDiv) {
            dubLanguagesDiv.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
        }

        showStatusMessage("Clearing filters...");

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs || tabs.length === 0 || !tabs[0].id) {
                console.error("Could not find active tab ID.");
                showStatusMessage("Error: Could not find active tab.", true);
                return;
            }

            if (!tabs[0].url || !tabs[0].url.includes('crunchyroll.com')) {
                showStatusMessage("Error: Not on a Crunchyroll page.", true);
                console.warn("Attempted to clear filters on a non-Crunchyroll page:", tabs[0].url);
                return;
            }

            const tabId = tabs[0].id;
            chrome.tabs.sendMessage(tabId, { action: 'clearFilters' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error(`Error sending clear message to tab ${tabId}:`, chrome.runtime.lastError.message);
                    if (chrome.runtime.lastError.message.includes("Could not establish connection") || chrome.runtime.lastError.message.includes("Receiving end does not exist")) {
                        showStatusMessage("Error: Cannot connect to page. Try refreshing.", true);
                    } else {
                        showStatusMessage(`Error: ${chrome.runtime.lastError.message}`, true);
                    }
                } else if (response && response.status === "Filters cleared") {
                    console.log("Content script cleared filters.", response);
                    showStatusMessage("Filters cleared.");
                    chrome.storage.local.remove('filters', () => {
                        console.log('Stored filters removed.');
                    });
                } else if (response && response.status) {
                    console.warn("Received response from content script:", response);
                    showStatusMessage(`Status: ${response.status}`, response.status.includes("Error"));
                } else {
                    console.warn("Received no or unexpected response from content script.");
                    showStatusMessage("No response from page.", true);
                }
            });
        });
    });
} else {
    console.error("Clear button not found!");
}

document.addEventListener('DOMContentLoaded', () => {
    if (episodesInput && ratingInput && dubLanguagesDiv && applyButton && clearButton && statusMessageDiv) {
        loadFilters();
    } else {
        console.error("One or more essential popup elements are missing. Cannot initialize.");
        showStatusMessage("Error: Popup UI failed to load.", true);
    }
});