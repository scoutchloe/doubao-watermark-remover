# Watermark Remover Extension

A Chrome browser extension that automatically removes watermarks from images on Doubao (doubao.com), Jimeng (jimeng.ai/jianying.com), and ByteDance platforms, with one-click download functionality for clean images.

## Latest Updates

- **New Image Download Feature**: Click button to directly download watermark-free images from pages
- Optimized compatibility with Jimeng Jianying (jimeng.jianying.com) website
- Fixed image display issues
- Improved button UI design with hover text display and icon-only default view
- Added smart filtering to download only images larger than 100x100 pixels

## Features

- Automatically detects and downloads watermark-free versions of Doubao, Jimeng, and ByteDance images
- Handles both directly loaded images and CSS background images
- Processes dynamically loaded images
- Provides floating download button in top-right corner on supported websites
- Clean user interface with manual trigger support

## Technical Architecture

### Core File Structure
```
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content-script.js      # Content script
├── content-style.css      # Content script styles
├── popup.html            # Popup window HTML
├── popup.js              # Popup window script
├── images/               # Icon resources
└── test-*.html           # Test pages
```

### Technical Implementation

- **Manifest V3**: Uses latest Chrome Extension APIs
- **declarativeNetRequest**: Intercepts and modifies network requests
- **Content Scripts**: Page content manipulation and DOM modification
- **Service Worker**: Background processing and permission management
- **Downloads API**: File download functionality

## How It Works

This extension uses multiple methods to remove watermarks and download images:

1. **URL Rewriting**: Uses Chrome's `declarativeNetRequest` API to intercept image requests and modify URLs to remove watermark parameters.

2. **DOM Modification**: Content scripts scan loaded images on pages and remove watermark parameters during download.

3. **Direct Download**: Retrieves watermark-free images and saves them directly to local storage.

## Installation

### Manual Installation (Developer Mode)

1. Download or clone this repository
```bash
git clone https://github.com/scoutchloe/doubao-watermark-remover.git
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension is now installed and ready to use

## Usage

The extension works automatically in the background while also supporting manual operations:

1. **Automatic Mode**: When you visit web pages containing Doubao, Jimeng, or ByteDance images, the extension automatically intercepts and modifies image requests to remove watermark parameters.

2. **Manual Mode**: On supported websites, you'll see a floating button in the top-right corner of the page.
   - Hover over the button to see "Download Watermark-Free Images" text
   - Click the button to scan all qualifying images on the page
   - Automatically downloads detected watermark-free images to your computer

3. **Extension Icon**: You can also click the extension icon in Chrome's toolbar to use features from the popup window.

## Supported Websites and Image Formats

- **Doubao** (doubao.com) images
- **Jimeng** (jimeng.ai) images
- **Jimeng Jianying** (jimeng.jianying.com) website buttons (but doesn't process images to avoid loading errors)
- **ByteDance** (byteimg.com) images
- Supports various watermark formats: `-watermark`, `-dark-watermark`, `~tplv-`, etc.

## Development and Testing

The project includes multiple test pages for development debugging:

- `test.html` - Basic test page
- `test-doubao.html` - Doubao website test
- `test-jimeng.html` - Jimeng website test
- `test-jianying.html` - Jianying website test

### Local Development

1. After modifying code, click "Reload" on the Chrome extensions management page
2. Use test pages to verify functionality
3. Check console output and network requests

## Troubleshooting

If the button doesn't appear or image downloads fail:

1. Ensure the extension is enabled and has proper permissions
2. Refresh the page - sometimes full loading is required before the button appears
3. On some websites (especially Jimeng Jianying), the extension limits automatic image processing to avoid loading errors
4. If downloads fail, it may be due to website restrictions or incompatible image formats

## Privacy Policy

This extension does not collect any data. It only modifies image URLs and downloads images on your device, without sending any information to external servers.

## License

MIT License

## Contributing

Issues and Pull Requests are welcome to improve this project.

## Changelog

### v1.2
- Added image download functionality
- Improved UI design
- Enhanced website compatibility

### v1.1
- Added support for Jimeng Jianying website
- Fixed image display issues

### v1.0
- Initial release
- Support for Doubao and Jimeng websites 