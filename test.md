# Markdown for Mac — Test Document

A clean, native markdown viewer for macOS. Open this file to verify the app is working correctly.

---

## Text Formatting

Regular paragraph text with **bold**, *italic*, ~~strikethrough~~, and `inline code`.

You can also write **_bold italic_** and use [links](https://github.com) to external sites.

## Headings

### Level 3

#### Level 4

##### Level 5

## Code Blocks

JavaScript with syntax highlighting:

```javascript
const greet = (name) => {
  return `Hello, ${name}!`;
};

console.log(greet('World'));
```

Python:

```python
def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

for num in fibonacci(10):
    print(num)
```

Shell:

```bash
npm install && npm start
```

## Blockquotes

> "The best tool is the one that gets out of your way."
>
> — Unknown

## Lists

### Unordered

- Renders GitHub-flavored Markdown
- Syntax highlighting for 190+ languages
- Auto-updating table of contents
- Dark and light mode support
- Drag & drop files

### Ordered

1. Open a markdown file (⌘O or drag & drop)
2. Navigate sections using the TOC sidebar
3. Use ⌘F to search in the document
4. Export to PDF with ⌘⇧E

### Task List

- [x] Markdown rendering
- [x] Syntax highlighting
- [x] Table of contents
- [x] Dark mode
- [ ] Custom themes (coming soon)

## Table

| Feature         | Status  | Notes                        |
|-----------------|---------|------------------------------|
| GFM support     | ✅      | Full GitHub-flavored markdown |
| Syntax highlight| ✅      | 190+ languages via highlight.js |
| TOC sidebar     | ✅      | Auto-generated from headings |
| Find in page    | ✅      | ⌘F                          |
| PDF export      | ✅      | ⌘⇧E                         |
| Folder browser  | ✅      | Open any folder              |

## Images

Images with relative or remote URLs render inline:

![Placeholder](https://via.placeholder.com/600x200/0071e3/ffffff?text=Markdown+for+Mac)

## Horizontal Rule

---

## Inline HTML

<details>
<summary>Click to expand</summary>

This content is hidden by default. HTML elements inside markdown work too.

</details>

---

*End of test document.*
