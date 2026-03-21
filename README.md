# Markdown for Mac

A clean, native markdown viewer for macOS built with Electron.

![Markdown for Mac](assets/icon.svg)

## Features

- **GitHub-Flavored Markdown** — full GFM support including tables, task lists, and strikethrough
- **Syntax Highlighting** — 190+ languages powered by highlight.js
- **Table of Contents** — auto-generated sidebar with scroll-spy highlighting
- **Folder Browser** — open a folder and navigate all `.md` files from the sidebar
- **Find in Document** — native find bar with next/previous navigation (⌘F)
- **Zoom** — adjustable font size (⌘+ / ⌘− / ⌘0)
- **Export to PDF** — print-ready PDF export (⌘⇧E)
- **Dark & Light Mode** — follows system preference automatically
- **Drag & Drop** — drop any `.md` file directly onto the window
- **Recent Files** — quick access to previously opened files
- **File Associations** — set as default app to open `.md` files from Finder

## Installation

### Option 1 — Build from source

First, make sure you have [Node.js](https://nodejs.org) installed. Then:

```bash
git clone https://github.com/albertgd/markdown-for-mac.git
cd markdown-for-mac
node --version   # should be 18 or later
npx electron-builder install-app-deps
npm run build
```

> If `npm` is not found, install Node.js first: `brew install node`

Then drag `dist/mac-arm64/Markdown for Mac.app` into your `/Applications` folder.

### Option 2 — Homebrew (personal tap)

```bash
brew tap albertgd/tap
brew install --cask markdown-for-mac
```

### Option 3 — Run in development mode

```bash
brew install node   # if not already installed
npm install
npm start
```

## Usage

| Action | Shortcut |
|---|---|
| Open file | ⌘O |
| Open folder | ⌘⇧O |
| Toggle sidebar | ⌘\ |
| Find in document | ⌘F |
| Zoom in / out / reset | ⌘+ / ⌘− / ⌘0 |
| Export to PDF | ⌘⇧E |
| Print | ⌘P |

### Set as default for `.md` files

1. Right-click any `.md` file in Finder
2. **Get Info** (⌘I)
3. Under **Open With**, select **Markdown for Mac**
4. Click **Change All…**

## Development

### Requirements

- macOS 12 or later
- Node.js 18 or later — install via `brew install node` if not present

### Project structure

```
markdown_for_mac/
├── main.js              # Electron main process
├── preload.js           # Secure contextBridge API
├── src/
│   ├── index.html       # App UI layout
│   ├── renderer.js      # Frontend logic
│   └── styles.css       # Styles (dark + light mode)
├── assets/
│   ├── icon.svg         # Source icon
│   └── icon.icns        # macOS icon bundle
└── scripts/
    ├── create-icon.sh           # Regenerates icon.icns from icon.svg
    └── homebrew-formula-template.rb  # Brew Cask formula template
```

### Rebuild the app icon

```bash
bash scripts/create-icon.sh
```

### Build a distributable `.app`

```bash
npm install      # install dependencies first
npm run build    # outputs to dist/mac-arm64/
```

### Build a `.dmg` installer

```bash
npm run dist     # outputs dist/Markdown for Mac-x.x.x.dmg
```

## Tech stack

| Library | Purpose |
|---|---|
| [Electron](https://electronjs.org) v28 | App framework |
| [marked](https://marked.js.org) v4 | Markdown parser |
| [highlight.js](https://highlightjs.org) v11 | Syntax highlighting |
| [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) v5 | Markdown body styles |
| [electron-builder](https://www.electron.build) v24 | Packaging & distribution |

## Support

Enjoying Markdown for Mac?
Consider supporting its development. Your donations help me dedicate more time to improving the app (and many more) for everyone.

[![Buy Me a Coffee](https://img.buymeacoffee.com/button-api/?text=Buy%20me%20a%20coffee&emoji=☕&slug=markdownformac&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff)](https://www.buymeacoffee.com/markdownformac)

## Author

**Albert Garcia Diaz** — created March 2026

## License

MIT
