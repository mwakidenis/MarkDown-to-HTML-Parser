/**
 * md-parser.js – A lightweight, self-contained Markdown-to-HTML parser.
 *
 * Supports:
 *   - ATX headings (#, ##, … ######)
 *   - Setext headings (underlined with = or -)
 *   - Paragraphs
 *   - Bold (**text** or __text__)
 *   - Italic (*text* or _text_)
 *   - Bold+Italic (***text***)
 *   - Inline code (`code`)
 *   - Fenced code blocks (``` or ~~~)
 *   - Blockquotes (>)
 *   - Unordered lists (-, *, +)
 *   - Ordered lists (1.)
 *   - Nested lists (indented by 2+ spaces or a tab)
 *   - Horizontal rules (---, ***, ___)
 *   - Links ([text](url "title"))
 *   - Images (![alt](url "title"))
 *   - Tables (GFM-style with | delimiters)
 *   - HTML entity escaping for safety
 *
 * Usage:
 *   mdParser.parse(markdownString) → htmlString
 */
var mdParser = (function () {
  'use strict';

  // ── Helpers ────────────────────────────────────────────────────────────────

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Escape HTML inside code spans / blocks but keep it readable.
  function escapeCode(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ── Inline parsing ─────────────────────────────────────────────────────────

  /**
   * Convert inline Markdown (bold, italic, code, links, images) to HTML.
   * We process in a single pass, handling the highest-priority constructs first.
   */
  function parseInline(text) {
    // 1. Stash code spans to protect their contents.
    var codeSpans = [];
    text = text.replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1/g, function (_, ticks, inner) {
      var idx = codeSpans.length;
      codeSpans.push('<code>' + escapeCode(inner.replace(/^\s|\s$/g, '')) + '</code>');
      return '\x00CODE' + idx + '\x00';
    });

    // 2. Images before links (both use similar syntax).
    text = text.replace(/!\[([^\]]*)\]\(([^)]*?)\)/g, function (_, alt, rest) {
      var parts = rest.match(/^(\S+?)(?:\s+"([^"]*)")?\s*$/);
      if (!parts) return escapeHtml(alt);
      var src   = parts[1];
      var title = parts[2] ? ' title="' + escapeHtml(parts[2]) + '"' : '';
      return '<img src="' + escapeHtml(src) + '" alt="' + escapeHtml(alt) + '"' + title + ' />';
    });

    // 3. Links.
    text = text.replace(/\[([^\]]+)\]\(([^)]*?)\)/g, function (_, label, rest) {
      var parts = rest.match(/^(\S+?)(?:\s+"([^"]*)")?\s*$/) || [null, rest];
      var href  = parts[1];
      var title = parts[2] ? ' title="' + escapeHtml(parts[2]) + '"' : '';
      return '<a href="' + escapeHtml(href) + '"' + title + '>' + parseInline(label) + '</a>';
    });

    // 4. Bold + italic together (***text***).
    text = text.replace(/(\*{3}|_{3})(.+?)\1/g, '<strong><em>$2</em></strong>');

    // 5. Bold (**text** or __text__).
    text = text.replace(/(\*{2}|_{2})(.+?)\1/g, '<strong>$2</strong>');

    // 6. Italic (*text* or _text_) – be conservative to avoid mid-word underscores.
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
    text = text.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');

    // 7. Hard line break (two trailing spaces).
    text = text.replace(/  \n/g, '<br />\n');

    // 8. Restore code spans.
    text = text.replace(/\x00CODE(\d+)\x00/g, function (_, i) {
      return codeSpans[parseInt(i, 10)];
    });

    return text;
  }

  // ── Block-level parsers ────────────────────────────────────────────────────

  /** Parse a GFM table block. Returns HTML string or null if not a table. */
  function parseTable(lines) {
    if (lines.length < 2) return null;
    var headerLine = lines[0];
    var sepLine    = lines[1];

    if (!/^\|?(?:\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(sepLine)) return null;

    function splitRow(row) {
      return row.replace(/^\||\|$/g, '').split('|').map(function (c) { return c.trim(); });
    }

    var headers = splitRow(headerLine);
    var seps    = splitRow(sepLine);
    var aligns  = seps.map(function (s) {
      if (/^:-+:$/.test(s)) return ' style="text-align:center"';
      if (/^-+:$/.test(s))  return ' style="text-align:right"';
      return '';
    });

    var html = '<table>\n<thead>\n<tr>';
    headers.forEach(function (h, i) {
      html += '<th' + (aligns[i] || '') + '>' + parseInline(h) + '</th>';
    });
    html += '</tr>\n</thead>\n<tbody>\n';

    for (var r = 2; r < lines.length; r++) {
      if (!lines[r].trim()) continue;
      var cells = splitRow(lines[r]);
      html += '<tr>';
      cells.forEach(function (c, i) {
        html += '<td' + (aligns[i] || '') + '>' + parseInline(c) + '</td>';
      });
      html += '</tr>\n';
    }

    html += '</tbody>\n</table>';
    return html;
  }

  /** Recursively render a list structure to HTML. */
  function renderList(items, ordered) {
    var tag  = ordered ? 'ol' : 'ul';
    var html = '<' + tag + '>\n';
    items.forEach(function (item) {
      html += '<li>';
      if (typeof item.content === 'string') {
        html += parseInline(item.content);
      } else {
        html += parseInline(item.content[0]);
        html += renderList(item.content[1], item.content[2]);
      }
      html += '</li>\n';
    });
    html += '</' + tag + '>';
    return html;
  }

  /** Parse a flat array of {indent, ordered, text} list tokens into a tree and render. */
  function buildList(tokens) {
    function parse(arr, minIndent) {
      var items   = [];
      var ordered = arr[0] ? arr[0].ordered : false;
      var i = 0;
      while (i < arr.length) {
        var tok = arr[i];
        if (tok.indent < minIndent) break;
        if (tok.indent === minIndent) {
          var subItems = [];
          var j = i + 1;
          while (j < arr.length && arr[j].indent > minIndent) {
            subItems.push(arr[j]);
            j++;
          }
          if (subItems.length) {
            var subOrdered = subItems[0].ordered;
            var sub = buildList(subItems);
            items.push({ content: [tok.text, parse(subItems, subItems[0].indent).items, subOrdered] });
          } else {
            items.push({ content: tok.text });
          }
          i++;
        } else {
          i++;
        }
      }
      return { items: items, ordered: ordered };
    }
    var result = parse(tokens, tokens[0].indent);
    return renderList(result.items, result.ordered);
  }

  // ── Main parse function ────────────────────────────────────────────────────

  function parse(md) {
    // Normalise line endings.
    var lines = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    var html      = '';
    var i         = 0;
    var paraLines = [];   // accumulator for paragraph text

    function flushPara() {
      if (!paraLines.length) return;
      html += '<p>' + parseInline(paraLines.join('\n')) + '</p>\n';
      paraLines = [];
    }

    while (i < lines.length) {
      var line = lines[i];

      // ── Blank line ──────────────────────────────────────────────────────
      if (/^\s*$/.test(line)) {
        flushPara();
        i++;
        continue;
      }

      // ── Fenced code block ──────────────────────────────────────────────
      var fenceMatch = line.match(/^(`{3,}|~{3,})([\w-]*)/);
      if (fenceMatch) {
        flushPara();
        var fence    = fenceMatch[1];
        var lang     = fenceMatch[2] ? ' class="language-' + escapeHtml(fenceMatch[2]) + '"' : '';
        var codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith(fence)) {
          codeLines.push(lines[i]);
          i++;
        }
        i++; // skip closing fence
        html += '<pre><code' + lang + '>' + escapeCode(codeLines.join('\n')) + '</code></pre>\n';
        continue;
      }

      // ── ATX Heading (#…) ───────────────────────────────────────────────
      var atxMatch = line.match(/^(#{1,6})\s+(.*?)(?:\s+#+\s*)?$/);
      if (atxMatch) {
        flushPara();
        var level = atxMatch[1].length;
        html += '<h' + level + '>' + parseInline(atxMatch[2].trim()) + '</h' + level + '>\n';
        i++;
        continue;
      }

      // ── Setext Heading (underlined with = or -) ────────────────────────
      if (i + 1 < lines.length) {
        var nextLine = lines[i + 1];
        if (/^=+\s*$/.test(nextLine) && line.trim()) {
          flushPara();
          html += '<h1>' + parseInline(line.trim()) + '</h1>\n';
          i += 2;
          continue;
        }
        if (/^-+\s*$/.test(nextLine) && line.trim() && !paraLines.length) {
          flushPara();
          html += '<h2>' + parseInline(line.trim()) + '</h2>\n';
          i += 2;
          continue;
        }
      }

      // ── Horizontal rule (--- / *** / ___) ─────────────────────────────
      if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) {
        flushPara();
        html += '<hr />\n';
        i++;
        continue;
      }

      // ── Blockquote ─────────────────────────────────────────────────────
      if (/^>\s?/.test(line)) {
        flushPara();
        var bqLines = [];
        while (i < lines.length && (/^>\s?/.test(lines[i]) || (bqLines.length && !/^\s*$/.test(lines[i])))) {
          bqLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        html += '<blockquote>\n' + parse(bqLines.join('\n')) + '</blockquote>\n';
        continue;
      }

      // ── List ───────────────────────────────────────────────────────────
      var listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s(.+)/);
      if (listMatch) {
        flushPara();
        var listTokens = [];
        while (i < lines.length) {
          var lm = lines[i].match(/^(\s*)([-*+]|\d+\.)\s(.+)/);
          if (!lm) {
            // Continuation line (same paragraph, not blank)?
            if (listTokens.length && !/^\s*$/.test(lines[i]) && /^\s{2,}/.test(lines[i])) {
              listTokens[listTokens.length - 1].text += ' ' + lines[i].trim();
              i++;
              continue;
            }
            break;
          }
          listTokens.push({
            indent:  lm[1].length,
            ordered: /\d+\./.test(lm[2]),
            text:    lm[3]
          });
          i++;
        }
        html += buildList(listTokens) + '\n';
        continue;
      }

      // ── GFM Table ──────────────────────────────────────────────────────
      if (/\|/.test(line)) {
        // Look ahead to collect all table rows.
        var tableLines = [line];
        var ti = i + 1;
        while (ti < lines.length && /\|/.test(lines[ti])) {
          tableLines.push(lines[ti]);
          ti++;
        }
        if (tableLines.length >= 2 && /^\|?[-:| ]+\|?\s*$/.test(tableLines[1])) {
          flushPara();
          var tableHtml = parseTable(tableLines);
          if (tableHtml) {
            html += tableHtml + '\n';
            i = ti;
            continue;
          }
        }
      }

      // ── Paragraph text ─────────────────────────────────────────────────
      paraLines.push(line);
      i++;
    }

    flushPara();
    return html;
  }

  return { parse: parse };
}());
