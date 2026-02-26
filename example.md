# MD to HTML Parser — Example

Welcome to the **MD to HTML Parser**! This tool converts Markdown files to HTML entirely in the browser — no backend required.

---

## Features

- **Live preview** — edit Markdown on the left and see HTML on the right instantly
- **Load any file** — enter a URL in the toolbar and click **Load**
- **Static hosting** — works on GitHub Pages or any static file server
- **No dependencies** — one HTML file + one CSS file + your `.md` files

---

## Usage

1. Clone or download this repository
2. Open `index.html` in your browser (or serve it with any static host)
3. Edit the Markdown on the left panel, or load a `.md` file via the toolbar

```bash
# Serve locally with Python
python -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

---

## Markdown Showcase

### Text formatting

You can write **bold**, *italic*, ~~strikethrough~~, and `inline code`.

### Blockquote

> "Any sufficiently advanced technology is indistinguishable from magic."
> — Arthur C. Clarke

### Lists

**Unordered:**
- Item one
- Item two
  - Nested item

**Ordered:**
1. First step
2. Second step
3. Third step

### Code block

```js
function greet(name) {
  return `Hello, ${name}!`;
}
console.log(greet('World'));
```

### Table

| Syntax    | Description |
|-----------|-------------|
| `#`       | Heading     |
| `**text**`| Bold        |
| `*text*`  | Italic      |
| `` `code` `` | Inline code |

### Links & images

[Visit GitHub](https://github.com) | [marked.js docs](https://marked.js.org)

---

## License

MIT © [mwakidenis](https://github.com/mwakidenis)
