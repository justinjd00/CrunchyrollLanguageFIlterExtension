
const AVAILABLE_LANGUAGES = [
    "English", "Japanese", "German", "Spanish", "French", "Portuguese", "Italian", "Russian"
];

function save_options() {
    const rating = document.getElementById('rating').value;
    const episodes = document.getElementById('episodes').value;

    const selectedDubLanguages = [];
    document.querySelectorAll('#dub-languages-container input:checked').forEach(function (checkbox) {
        selectedDubLanguages.push(checkbox.value);
    });

    const filters = {
        rating: rating,
        episodes: episodes,
        selectedDubLanguages: selectedDubLanguages,
        status: 'All'
    };

    chrome.storage.local.set({ 'filters': filters }, function () {
        // Update status to let user know options were saved.
        const status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function () {
            status.textContent = '';
        }, 1500);
    });
}

function restore_options() {
    const container = document.getElementById('dub-languages-container');
    AVAILABLE_LANGUAGES.forEach(lang => {
        const checkboxLabel = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = lang;
        checkbox.id = `lang-${lang.toLowerCase()}`;

        checkboxLabel.appendChild(checkbox);
        checkboxLabel.appendChild(document.createTextNode(` ${lang}`));
        container.appendChild(checkboxLabel);
    });

    chrome.storage.local.get(['filters'], function (result) {
        const filters = result.filters || {};
        document.getElementById('rating').value = filters.rating || '';
        document.getElementById('episodes').value = filters.episodes || '';

        const selectedDubs = filters.selectedDubLanguages || [];
        selectedDubs.forEach(lang => {
            const checkbox = document.getElementById(`lang-${lang.toLowerCase()}`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('options-form').addEventListener('submit', function (e) {
    e.preventDefault();
    save_options();
});