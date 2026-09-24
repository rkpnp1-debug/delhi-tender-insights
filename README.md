# Delhi Tender Insights

Modern public-procurement intelligence platform for Delhi.

Fetches, cleans, and presents active tenders from the official Delhi Government e-Procurement portal ([govtprocurement.delhi.gov.in](https://govtprocurement.delhi.gov.in/nicgep/app)) with department / zone / category / value analytics, smart filters, dark mode, Excel export, and favourites.

## Quick Start

```bash
cd delhi-tender-insights
npm install
npm run dev
```

Open http://localhost:3000

```bash
npm run build && npm start   # production
```

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + custom navy/saffron design system
- TanStack Query (20-min cache)
- Recharts for analytics
- SheetJS for Excel export
- next-themes for dark/light mode

## Key Features

| Feature | Description |
|--------|-------------|
| Tender cards | Title, org, zone, value, closing date, New / Closing-soon / Corrigendum badges |
| Detail drawer | Full fields + link to official portal |
| Analytics | Department, zone, category, value-range charts |
| Filters | Search + multi-select dept / zone / category / corrigendum |
| Export | One-click filtered Excel download |
| Favourites | Star tenders (localStorage) |
| Responsive | Mobile-first, tablet, desktop |
| Resilient data | Live portal attempt → sample fallback (real orgs & patterns) |

## Data Layer

The GePNIC portal uses sessions + captcha on many pages. `src/lib/scraper.ts`:

1. Attempts a lightweight live fetch.
2. Falls back to high-quality sample data (PWD, DJB, NDMC, DSIIDC, I&FC, DUSIB, IPGCL, etc.).
3. Caches for 20 minutes.

For full production coverage, schedule a Playwright worker or use a licensed tender API; the UI accepts any source matching the `Tender` type.

## Disclaimer

**Independent insight tool.** Official source remains **govtprocurement.delhi.gov.in**. Always verify dates and documents on the official portal before bidding.

## Licence

MIT
