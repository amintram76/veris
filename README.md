# Veris

*Primary Care Insight & Support*

> Clarity, fresh thinking and genuine support for those who lead in primary care.

**Live at:** [veris.org.uk](https://veris.org.uk)

---

## Getting started locally

```bash
npm install       # one-time setup
npm run dev       # start local preview at http://localhost:5173
```

---

## Deploying to Netlify

Same workflow as The Aperture:

1. Push to a GitHub repository
2. Connect the repo to Netlify (Build command: `npm run build`, Publish directory: `dist`)
3. Every `git push` triggers an automatic redeploy

To connect `veris.org.uk`: add the domain in Netlify → Site settings → Domain management, then update DNS records at your registrar.

---

## Adding content

### New tool
Add an entry to `src/pages/ToolsPage.jsx` in the `tools` array.

### New article
Add an entry to `src/pages/ArticlesPage.jsx` in the `articles` array.

For external articles (e.g. Practice Index), set `external: true` and provide the `link`.
For articles hosted on Veris itself, create a new page and add a route in `src/App.jsx`.

---

## Colour palette

| Token | Value | Use |
|---|---|---|
| `--green-vivid` | `#52B788` | Accents, hover states |
| `--green-deep` | `#2D6A4F` | Primary actions, headings |
| `--green-light` | `#D8F3DC` | Backgrounds, tags |
| `--ink` | `#1A2E22` | Body text |
| `--surface` | `#FAFCFA` | Page background |
