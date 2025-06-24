function extractLanguagesFromTags(html) {
    try {
        const pattern = /data-t="detail-row-audio-language"[\s\S]*?data-t="details-item-description"[^>]*>([^<]+)<\/h5>/i;
        const match = html.match(pattern);

        if (match && match[1]) {
            const languagesText = match[1].trim();
            return languagesText.split(/,\s*/).map(lang => lang.trim()).filter(Boolean);
        }
        return [];
    } catch (error) {
        console.error("Error extracting languages from tags:", error);
        return [];
    }
}

const languageCache = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchLanguages' && request.url) {
        const seriesUrl = request.url.startsWith('http') ? request.url : `https://www.crunchyroll.com${request.url}`;

        if (languageCache.has(seriesUrl)) {
            sendResponse({ languages: languageCache.get(seriesUrl) });
            return;
        }

        fetch(seriesUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                const languages = extractLanguagesFromTags(html);
                if (languages.length === 0) {
                    languages.push("Japanese");
                }
                languageCache.set(seriesUrl, languages);
                sendResponse({ languages: languages });
            })
            .catch(error => {
                console.error(`Fetch failed for ${seriesUrl}:`, error);
                sendResponse({ languages: ["Japanese"] });
            });

        return true;
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Extension installed');
        chrome.storage.sync.set({
            crunchyFilterSettings: {
                selectedDubLanguages: ['Japanese', 'English'],
                episodes: '',
                status: 'All',
                rating: '',
                autoApply: false
            }
        });
    } else if (details.reason === 'update') {
        console.log(`Extension updated from ${details.previousVersion} to ${chrome.runtime.getManifest().version}`);
    }
});