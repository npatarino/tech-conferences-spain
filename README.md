# tech-conferences-spain

A community-curated list of software development conferences held in Spain — past, present, and upcoming.

**Live site:** [techconf.chimi.pro](https://techconf.chimi.pro)

---

## What's tracked

Each conference edition is a single Markdown file with YAML frontmatter. The site builds automatically from the `content/conferences/` directory and renders:

- An upcoming events index
- A past events archive
- A calendar view
- A map view (Google Maps)
- An insights page (edition trends, city breakdown)

---

## Adding a conference

### 1. Find (or create) the event directory

Conferences are grouped by recurring event, not by year. Each event lives in its own folder:

```
content/conferences/
├── t3chfest-madrid/
│   ├── t3chfest-madrid-2024.md
│   ├── t3chfest-madrid-2025.md
│   └── t3chfest-madrid-2026.md
├── devbcn-barcelona/
│   ├── devbcn-barcelona-2024.md
│   └── devbcn-barcelona-2025.md
└── coolconf-valencia/        ← new event → new folder
    └── coolconf-valencia-2026.md
```

**Folder naming:** `event-name-city/` — lowercase, hyphen-separated.

**File naming:** `event-name-city-YYYY.md` — same slug as folder, plus the year.

### 2. Create the conference file

```yaml
---
name: "CoolConf"
website: https://coolconf.es/2026/
twitter: https://x.com/coolconf
location: Valencia, Spain

date_start: 2026-10-15
date_end:   2026-10-16
---
```

### Full field reference

| Field | Required | Description |
|---|---|---|
| `name` | Yes | The display name of the conference. Do not include city — it's rendered from `location`. |
| `website` | Yes | Full URL to the edition's homepage. |
| `twitter` | No | Twitter/X profile of the event. |
| `location` | Yes | `City, Region, Spain` — used for map geocoding. Be specific enough to disambiguate. |
| `date_start` | Yes | ISO date `YYYY-MM-DD`. |
| `date_end` | Yes | ISO date `YYYY-MM-DD`. Same as `date_start` for single-day events. |
| `cfp_start` | No | When the Call for Papers opens. |
| `cfp_end` | No | When the Call for Papers closes. |
| `cfp_site` | No | Direct URL to the CFP page. Defaults to `website` if omitted. |
| `cancelled` | No | Set to `true` if the edition was cancelled. |
| `date_tbc` | No | Set to `true` if dates are not yet confirmed (use approximate dates in `date_start`/`date_end`). |

### Full example with all fields

```yaml
---
name: "CoolConf"
website: https://coolconf.es/2026/
twitter: https://x.com/coolconf
location: Valencia, Spain

date_start: 2026-10-15
date_end:   2026-10-16

cfp_start: 2026-05-01
cfp_end:   2026-07-31
cfp_site:  https://coolconf.es/2026/call-for-papers
---
```

### Cancelled edition example

```yaml
---
name: "CoolConf"
website: https://coolconf.es/2020/
location: Valencia, Spain
cancelled: true

date_start: 2020-03-20
date_end:   2020-03-21
---
```

### Dates-to-be-confirmed example

```yaml
---
name: "CoolConf"
website: https://coolconf.es/2027/
location: Valencia, Spain

date_start: 2027-10-01
date_end:   2027-10-31
date_tbc: true
---
```

---

## Running locally

```bash
npm install
npm run dev
```

The site starts at [http://localhost:4000](http://localhost:4000) (port may vary — check terminal output).

### First-time setup

The build syncs fonts and SEO assets from the design system package before starting:

```bash
npm run sync   # sync fonts + SEO assets from node_modules
npm run build  # production build → dist/
```

### Environment variables

Copy `.env.example` and fill in values if you want the map page to work locally:

```bash
cp .env.example .env
# Edit .env and add your GOOGLE_MAPS_API_KEY
```

The map will silently degrade (no markers rendered) if the key is missing.

---

## Project structure

```
content/conferences/      ← all conference data (Markdown + YAML)
public/                   ← static assets (icons, OG image, fonts)
scripts/                  ← build helpers (font sync, SEO asset sync)
src/
├── components/           ← Astro components (EventRow, MonthGroup, ViewSwitcher)
├── layouts/              ← Base layout wrapping every page
├── lib/                  ← utilities (date formatting, geocoding, insights logic)
├── loaders/              ← Astro content loader (reads content/conferences/)
├── pages/                ← one file per route (index, calendar, map, past, insights)
├── seo/                  ← JSON-LD helpers
└── styles/               ← global CSS (design-system tokens + overrides)
astro.config.mjs          ← Astro config (via @chimichurricode/web-app-kit)
package.json
```

---

## Contributing

1. **Fork** this repo and create a branch.
2. **Add or update** a conference file following the format above.
3. **Open a pull request** with a short description of what you added.

A few conventions to keep things consistent:

- Use the official conference name in `name`, without city or year.
- Prefer `https://` URLs.
- For location, use the full `City, Region, Spain` format — this is what the geocoder uses.
- If a CFP hasn't opened yet but the website is live, add `cfp_start` and `cfp_end` when you know them.
- If an event is recurring but skipped a year, there's no need to add a cancelled file unless you want to document the cancellation.

---

## License

All conference data is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
