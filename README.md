# Color Extractor

A React application that extracts color palettes from webpages. Simply enter a URL, and the app will extract all colors from the page, categorizing them into light and dark color groups.

## Features

- 🌐 Extract colors from any webpage URL
- 🎨 Automatic color categorization (light/dark)
- 📋 Click to copy color codes
- 🎯 Beautiful, modern UI
- ⚡ Fast and efficient color extraction

## How It Works

The app extracts colors from:
- Inline styles in HTML elements
- `<style>` tags in the HTML
- External stylesheets (linked CSS files)
- Supports hex, rgb, rgba, hsl, and hsla color formats

Colors are categorized as light or dark based on their luminance value using the WCAG standard.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

This will start both the React frontend (on port 3000) and the Express backend (on port 3001).

## Usage

1. Open http://localhost:3000 in your browser
2. Enter a valid webpage URL
3. Click "Extract Colors"
4. View the extracted colors grouped by light and dark
5. Click any color to copy its hex code to your clipboard

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Express.js
- **HTML Parsing**: Cheerio
- **HTTP Client**: node-fetch

## License

MIT

