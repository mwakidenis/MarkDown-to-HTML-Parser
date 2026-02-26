# MD to HTML Parser

Convert Markdown files to HTML — entirely in the browser, with no backend required.

## Features

- **Zero dependencies** – no build step, no server, no npm install
- **GitHub Flavoured Markdown** – tables, task lists, fenced code blocks, and more
- **Static hosting ready** – deploy to GitHub Pages, Netlify, Vercel, or any CDN
- **Instant rendering** – your `.md` file is fetched and parsed on the fly

## How It Works

The page fetches the Markdown file with the browser's native `fetch` API and passes
the raw text to the built-in `md-parser.js` for parsing. The resulting HTML
is injected directly into the page — no server-side rendering needed.

## Usage

1. Clone or download this repository.
2. Edit `index.html` and change `MARKDOWN_FILE` to point to your `.md` file:

```html
var MARKDOWN_FILE = 'your-file.md';
```

3. Open `index.html` in a browser (or deploy to any static host).

> **Note:** Browsers block `fetch` for local `file://` URLs. Use a local development
> server such as `npx serve .` or the VS Code *Live Server* extension.

## Supported Syntax

### Inline Formatting

| Syntax | Output |
|---|---|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `` `code` `` | `code` |
| `[link](url)` | [link](https://example.com) |

### Headings

```
# H1
## H2
### H3
```

### Lists

- Unordered list item
- Another item
  - Nested item

1. Ordered list item
2. Second item
3. Third item

### Blockquote

> "Any sufficiently advanced technology is indistinguishable from magic."
> — Arthur C. Clarke

### Code Block

```javascript
// Fetch and render a Markdown file
fetch('content.md')
  .then(r => r.text())
  .then(md => { document.getElementById('content').innerHTML = mdParser.parse(md); });
```

### Table

| Language | Typed | Compiled |
|---|---|---|
| JavaScript | No  | No  |
| TypeScript | Yes | Yes |
| Python     | No  | No  |
| Go         | Yes | Yes |

---

## Project Structure

```
MD-to-HTML-Parser/
├── index.html     ← main page (open this in a browser)
├── style.css      ← stylesheet for rendered Markdown
├── md-parser.js   ← self-contained Markdown-to-HTML parser
└── content.md     ← sample Markdown file (this file)
```

## License

MIT – free to use, modify, and distribute.
