# Ikigai 2.0

Private purpose map. Data stays in your browser.

## What it does

1. **What I want** — direction
2. **What I deliver** — what others would own or use
3. **Who needs it** — demand
4. **How I’m rewarded** — the exchange you want
5. **Skills** — have vs lack (editable)
6. **Insights** — connection overlaps + 3–5 ideas (auto or manual)
7. **Notes** — mini journal with map tags, search, date filter
8. **Synthesis** — plain summary of the map

## Stack

- Next.js 15 + TypeScript
- Tailwind CSS v4
- localStorage only (`ikigai:v2`)

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Overview + ikigai diagram + progress |
| `/map` | Four questions + synthesis |
| `/skills` | Skills you have / lack |
| `/insights` | Connection view + ideas |
| `/notes` | Tagged mini journal |

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
