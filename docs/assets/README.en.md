# 🖼 docs/assets

This folder stores static assets referenced by the README and other docs.

## 📁 Directories

- `screenshots/`: product UI captures for the README, phase notes, and deployment docs
- `diagrams/`: architecture diagrams, flow charts, and comparison visuals

## 🏷 Naming Convention

Use this format:

```text
<page>-<theme>-<locale>.<ext>
```

Examples:

```text
hero.png
landing-light-zh.png
sign-in-light-zh.png
dashboard-light-zh.png
board-light-zh.png
list-light-zh.png
detail-light-zh.png
timeline-light-zh.png
language-toggle.webp
```

Field rules:

- `<page>`: page keyword such as `landing`, `sign-in`, `dashboard`, `board`, `list`, `detail`, or `timeline`
- `<theme>`: `light` or `dark`; prefer `light` for the main README so the gallery feels consistent
- `<locale>`: `zh` or `en`; the main README can use Chinese screenshots first, and the English README can reuse them until dedicated English shots are ready
- `<ext>`: use `.png` for static captures, `.webp` for short motion clips, and `.gif` only if needed

## 📐 Resolution and Compression

- Recommended browser width: `1440px`
- Export target: 2x captures, ideally within `2880px` width
- Compressed PNG target: `< 500 KB`
- Motion clip target: `< 2 MB`
- Suggested motion duration: `3s - 8s`

## 🔗 Referencing Assets in the README

Center the hero image:

```html
<p align="center">
  <img src="docs/assets/screenshots/hero.png" alt="JobFlow hero" width="880">
</p>
```

Prefer an HTML `table + img` gallery so widths stay predictable on GitHub:

```html
<table>
  <tr>
    <td align="center"><strong>Dashboard</strong></td>
    <td align="center"><strong>Board</strong></td>
    <td align="center"><strong>List</strong></td>
  </tr>
  <tr>
    <td><img src="./docs/assets/screenshots/dashboard-light-zh.png" alt="Dashboard" width="100%"></td>
    <td><img src="./docs/assets/screenshots/board-light-zh.png" alt="Board" width="100%"></td>
    <td><img src="./docs/assets/screenshots/list-light-zh.png" alt="List" width="100%"></td>
  </tr>
</table>
```

## 📸 Screenshot Checklist

### 1. `landing-light-zh.png`

- Purpose: introduce the product at a glance
- Keep visible: headline, primary CTA, and the locale toggle
- Avoid: too much browser chrome or empty whitespace

### 2. `sign-in-light-zh.png`

- Purpose: show that sign-in is part of the working flow
- Keep visible: email field, password field, sign-in button, locale toggle
- Note: use demo values or blurred values, not real credentials

### 3. `sign-up-light-zh.png`

- Purpose: show that registration works
- Keep visible: form fields, submit button, and the link back to sign-in
- Note: a clean success-ready state is better than a forced error screenshot

### 4. `dashboard-light-zh.png`

- Purpose: the main overview shot
- Keep visible: metric cards, upcoming items, and recent activity
- Note: avoid large empty sections

### 5. `board-light-zh.png`

- Purpose: show pipeline movement
- Keep visible: at least five populated columns
- Note: prepare demo data that feels closer to real applications

### 6. `list-light-zh.png`

- Purpose: show search, filtering, sorting, and table management
- Keep visible: filters, table headers, and enough rows to feel real
- Note: the screenshot should communicate “management view” in one frame

### 7. `detail-light-zh.png`

- Purpose: show the depth of a single application record
- Keep visible: company, role, status, key dates, and note summary
- Note: keep the main page content in view instead of a narrow crop

### 8. `timeline-light-zh.png`

- Purpose: highlight traceability
- Keep visible: chronological events and notes
- Note: three to five records usually make the view feel complete

### 9. `language-toggle.webp`

- Purpose: prove that locale switching updates the current page immediately
- Suggested content: a short before/after clip on the same page
- Note: a side-by-side comparison image also works if motion capture is inconvenient

## ✅ Before You Capture

- Use the light theme for the main README gallery.
- Prefer Chinese UI for the primary screenshot set so it matches the Chinese README.
- Prepare 6 to 10 believable demo records instead of placeholder-style content.
- Crop out browser UI that does not help explain the product.
- If the same image set is used in both languages, keep the framing consistent first and localize later if needed.
