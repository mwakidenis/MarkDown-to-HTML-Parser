# MD-to-HTML-Parser

> **Add this to your website:** convert Markdown to HTML — entirely in the browser, no backend needed.

This open-source project renders Markdown (`.md`) files as styled HTML using only:

- **One HTML file** (`index.html`)
- **One CSS file** (`style.css`)
- **Standard Markdown files** (e.g. `example.md`)
- **No backend** — works on GitHub Pages or any static host

## Live Demo

Deploy the repo to [GitHub Pages](https://pages.github.com/) and open the URL.  
Or serve it locally:

```bash
python -m http.server 8080
# then open http://localhost:8080
```

## Usage

1. Clone this repository
2. Open `index.html` in a browser (or any static host)
3. Edit Markdown in the left panel — the right panel updates instantly
4. Enter any `.md` file URL in the toolbar and click **Load** to render it

## Project structure

```
MD-to-HTML-Parser/
├── index.html      # Single-page app — fetches & renders Markdown
├── style.css       # Styling for the UI and rendered HTML
├── marked.min.js   # Bundled marked.js library (UMD build, no CDN required)
└── example.md      # Sample Markdown file loaded on startup
```

## How it works

`index.html` uses the [marked.js](https://marked.js.org) library (bundled locally as `marked.min.js`) to parse Markdown text into HTML at runtime.  
The page fetches a `.md` file via `fetch()`, parses it, and injects the resulting HTML into the preview panel.  
Everything runs client-side — no server, no build step.

## License

MIT © [mwakidenis](https://github.com/mwakidenis)
