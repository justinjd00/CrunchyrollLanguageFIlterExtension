const SELECTORS = {
    cardContainers: [
        '.browse-card',
        '.erc-browse-card',
        'a[data-testid="content-card"]',
        '.card'
    ].join(', '),

    card: {
        container: '.browse-card, .erc-browse-card',
        titleStatic: 'h4[data-t="title"] a.browse-card__title-link--SLlRM, .card-title a',
        metaTagsStatic: '.meta-tags__tag-wrapper--fzf-1 span, .card-metadata span',
        seriesLink: 'a.browse-card__title-link--SLlRM, a.card-link, a[data-t="hover-link"]',
        hoverContainer: '.browse-card-hover--CxFWw',
        titleHover: 'h4[data-t="title"] a.browse-card-hover__title-link--A6aAw',
        ratingHover: '.star-rating-short-static__rating--bdAfR',
        metaHover: '.browse-card-hover__meta--aB4TP span',
        descriptionHover: '.browse-card-hover__description--e28NH',
    },

    ui: {
        indicatorId: 'crunchy-filter-indicator'
    },

    background: {
        specificAudioPattern: '<div[^>]*class="[^"]*details-item[^"]*"[^>]*data-t="detail-row-audio-language"[^>]*>[\\s\\S]*?<h5[^>]*data-t="details-item-name"[^>]*>Audio[^<]*<\\/h5>[\\s\\S]*?<h5[^>]*data-t="details-item-description"[^>]*>([^<]+)<\\/h5>',
        genericAudioPattern: '<div[^>]*data-t="detail-row-audio-language"[^>]*>[\\s\\S]*?<h5[^>]*data-t="details-item-description"[^>]*>([^<]+)<\\/h5>',
        fallbackAudioPattern: 'data-t="detail-row-audio-language"[\\s\\S]*?Audio:?[^<]*<\\/h5>[\\s\\S]*?<h5[^>]*>([^<]+)<\\/h5>'
    }
};

console.log("Crunchyroll Filter Extension: Content script loaded. v3 (Fetch Enabled)");

function extractLocalCardData(cardElement) {
    const data = {
        title: null,
        year: null,
        episodes: null,
        rating: null,
        hasSubs: false,
        hasDubs: false,
        seriesUrl: null,
        dubLanguages: []
    };

    try {
        const container = cardElement.closest(SELECTORS.card.container) || cardElement;

        const titleElement = container.querySelector('h4 a');
        if (titleElement) data.title = titleElement.textContent.trim();

        const seriesLinkElement = container.querySelector('a');
        if (seriesLinkElement) data.seriesUrl = seriesLinkElement.getAttribute('href');

        const metaText = container.textContent.toLowerCase();
        const yearMatch = metaText.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) data.year = parseInt(yearMatch[0], 10);

        const episodeMatch = metaText.match(/(\d+)\s+episoden?/i);
        if (episodeMatch) data.episodes = parseInt(episodeMatch[1], 10);

        const ratingElement = container.querySelector(SELECTORS.card.ratingHover);
        if (ratingElement) {
            const ratingText = ratingElement.textContent.replace(',', '.').trim();
            const ratingValue = parseFloat(ratingText);
            if (!isNaN(ratingValue)) data.rating = ratingValue;
        }

        if (metaText.includes('untertitel')) data.hasSubs = true;
        if (metaText.includes('synchro')) data.hasDubs = true;

        const languageElement = container.querySelector('[data-t="detail-row-audio-language"] [data-t="details-item-description"]');
        if (languageElement) {
            const languagesText = languageElement.textContent;
            data.dubLanguages = normalizeLanguages(languagesText.split(','));
        } else {
            data.dubLanguages = [];
        }

    } catch (error) {
        console.error("Error extracting local data from card:", error, cardElement);
    }
    return data;
}

function normalizeLanguages(languages) {
    const normalized = languages.map(lang => {
        lang = lang.trim();
        if (/english/i.test(lang)) return "English";
        if (/japanese|日本語/i.test(lang)) return "Japanese";
        if (/german|deutsch/i.test(lang)) return "German";
        if (/spanish|español/i.test(lang)) return "Spanish";
        if (/french|français/i.test(lang)) return "French";
        if (/portuguese|português/i.test(lang)) return "Portuguese";
        if (/italian|italiano/i.test(lang)) return "Italian";
        if (/russian|русский/i.test(lang)) return "Russian";
        return lang;
    }).filter(Boolean);
    return [...new Set(normalized)];
}

async function filterAnimeCards(filters) {
    console.log("Filtering logic started with:", filters);
    updateFilterIndicator(-1, -1);

    const animeCards = document.querySelectorAll(SELECTORS.cardContainers);
    const totalCards = animeCards.length;
    if (totalCards === 0) {
        updateFilterIndicator(0, 0);
        return { visibleCount: 0, totalCount: 0 };
    }

    const needsDubFilter = filters.selectedDubLanguages && filters.selectedDubLanguages.length > 0;
    const cardDataMap = new Map();
    const fetchPromises = [];

    animeCards.forEach(card => {
        const container = card.closest(SELECTORS.card.container) || card;
        const localData = extractLocalCardData(container);
        cardDataMap.set(container, { localData });

        if (needsDubFilter && localData.seriesUrl) {
            const promise = chrome.runtime.sendMessage({ action: 'fetchLanguages', url: localData.seriesUrl })
                .then(response => {
                    cardDataMap.get(container).fetchedLanguages = response?.languages || [];
                })
                .catch(error => {
                    console.error(`Error fetching languages for ${localData.title}:`, error);
                    cardDataMap.get(container).fetchedLanguages = [];
                });
            fetchPromises.push(promise);
        }
    });

    if (fetchPromises.length > 0) {
        await Promise.allSettled(fetchPromises);
    }

    let visibleCount = 0;
    cardDataMap.forEach(({ localData, fetchedLanguages }, container) => {
        let isVisible = true;

        const filterEpisodes = filters.episodes ? parseInt(filters.episodes, 10) : null;
        if (filterEpisodes !== null && (localData.episodes === null || localData.episodes < filterEpisodes)) {
            isVisible = false;
        }
        const filterRating = filters.rating ? parseFloat(filters.rating) : null;
        if (isVisible && filterRating !== null && localData.rating !== null && localData.rating < filterRating) {
            isVisible = false;
        }

        if (isVisible && needsDubFilter) {
            const availableDubs = normalizeLanguages(fetchedLanguages || []);
            const cardHasSelectedDub = filters.selectedDubLanguages.some(selectedLang =>
                availableDubs.some(cardLang => cardLang.toLowerCase() === selectedLang.toLowerCase())
            );
            if (!cardHasSelectedDub) {
                isVisible = false;
            }
        }

        container.style.display = isVisible ? '' : 'none';
        if (isVisible) visibleCount++;
    });

    console.log(`Filtering logic finished. Visible cards: ${visibleCount}/${totalCards}`);
    updateFilterIndicator(visibleCount, totalCards);
    return { visibleCount, totalCount: totalCards };
}

function clearAllFilters() {
    console.log("Clearing all filters...");
    const animeCards = document.querySelectorAll(SELECTORS.cardContainers);
    animeCards.forEach(card => {
        const container = card.closest(SELECTORS.card.container) || card;
        container.style.display = '';
    });
    const totalCards = animeCards.length;
    console.log(`Cleared filters for ${totalCards} cards.`);
    updateFilterIndicator(totalCards, totalCards);
    chrome.storage.local.remove('filters', () => {
        console.log('Stored filters cleared.');
    });
    return { visibleCount: totalCards, totalCount: totalCards };
}

function updateFilterIndicator(visibleCount, totalCount) {
    let indicator = document.getElementById(SELECTORS.ui.indicatorId);
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = SELECTORS.ui.indicatorId;
        indicator.style.position = 'fixed';
        indicator.style.top = '70px';
        indicator.style.right = '20px';
        indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        indicator.style.color = 'white';
        indicator.style.padding = '8px 15px';
        indicator.style.borderRadius = '5px';
        indicator.style.zIndex = '9999';
        indicator.style.fontSize = '14px';
        indicator.style.fontFamily = 'sans-serif';
        indicator.style.display = 'none';
        document.body.appendChild(indicator);
    }

    if (visibleCount === -1 && totalCount === -1) {
        indicator.textContent = 'Filtering...';
        indicator.style.display = 'block';
    } else if (visibleCount === totalCount) {
        indicator.style.display = 'none';
    } else {
        indicator.textContent = `Showing ${visibleCount} of ${totalCount} results`;
        indicator.style.display = 'block';
    }
}

function handleMessage(request, sender, sendResponse) {
    console.log("Message received in content script:", request);

    if (request.action === 'applyFilters') {
        filterAnimeCards(request.filters).then(counts => {
            sendResponse({ status: "Filters applied", ...counts });
        });
    } else if (request.action === 'clearFilters') {
        const counts = clearAllFilters();
        sendResponse({ status: "Filters cleared", ...counts });
    }
    return true;
}

function initialize() {
    console.log("Crunchyroll Filter Extension: Initializing...");
    chrome.runtime.onMessage.addListener(handleMessage);
    console.log("Crunchyroll Filter Extension: Content script fully initialized and listening.");
}

initialize();