# Crunchyroll Advanced Filter

[![Code License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Chrome-brightgreen.svg)]()
[![GitHub Stars](https://img.shields.io/github/stars/YourUsername/YourRepo?style=social)](https://github.com/YourUsername/YourRepo/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/YourUsername/YourRepo?style=social)](https://github.com/YourUsername/YourRepo/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/YourUsername/YourRepo)](https://github.com/YourUsername/YourRepo/issues)
[![GitHub last commit](https://img.shields.io/github/last-commit/YourUsername/YourRepo)](https://github.com/YourUsername/YourRepo/commits/main)

An unofficial browser extension for Google Chrome that enhances the browsing experience on Crunchyroll with powerful, persistent filtering options.

## 🌟 Key Features

- **Filter by Minimum Rating**: Only show series with a rating of 4.5 stars or higher.
- **Filter by Minimum Episodes**: Hide shorts and single-episode series by setting a minimum episode count.
- **Filter by Dub Language**: See only the shows that have a specific dub track available (e.g., German, English, etc.).
- **Persistent Settings**: Set your default filters in the options page, and they will be automatically applied every time you visit Crunchyroll.
- **Dynamic Content Support**: Filters are automatically re-applied when you scroll down and new shows are loaded on the page.
- **Built for Maintainability**: CSS selectors and patterns are centralized, making the extension easier to fix if a Crunchyroll update breaks it.

## 🚀 Installation

Since this is an unofficial extension, it is not available on the Chrome Web Store. You need to install it manually.

1.  **Download the Code**: Download this project as a ZIP file from GitHub and unzip it.
2.  **Open Chrome Extensions**: Open Google Chrome and navigate to `chrome://extensions/`.
3.  **Enable Developer Mode**: In the top right corner of the Extensions page, toggle the "Developer mode" switch to **on**.
4.  **Load the Extension**:
    *   Click the **"Load unpacked"** button that appears.
    *   In the file selection dialog, navigate to the unzipped project folder and select the `crunchyroll-filter-extension` directory.
5.  The extension should now be installed and visible in your extensions list!

## ⚙️ How to Use

1.  **Set Your Defaults (Optional)**:
    *   Right-click the extension icon in your Chrome toolbar and select "Options".
    *   Set your preferred minimum rating, episode count, and default dub languages.
    *   Click "Save Settings". These will now apply automatically.
2.  **Filter on the Fly**:
    *   Navigate to a browse or search page on `crunchyroll.com`.
    *   Click the extension icon to open the popup.
    *   Apply or change filters and click "Apply Filter". The content on the page will update instantly.

## ⚠️ Troubleshooting / It Broke!

This extension depends on the HTML structure and class names of the Crunchyroll website. When Crunchyroll updates its website, the extension may stop working correctly.

**The most common reason for breakage is a change in the website's CSS selectors.**

We have made this as easy to fix as possible for advanced users. All the critical selectors are located in a single file:

`/src/config/selectors.js`

If the extension breaks, it is likely that one or more of the selectors in this file need to be updated to match the new structure of the Crunchyroll website. You can do this by inspecting the HTML on Crunchyroll's pages and updating the values in this file.

## Disclaimer

This is an unofficial extension and is not affiliated with, endorsed by, or sponsored by Crunchyroll or Sony. It is a fan-made tool created to enhance the user experience.