# Ikigai 2.0

Private purpose map. Four questions + skill gap. Data stays in your browser.

## What it does

1. **What I want** — direction
2. **What I deliver** — what others would own or use
3. **Who needs it** — demand
4. **How I’m rewarded** — the exchange you want
5. **Skills** — have vs lack
6. **Synthesis** — plain summary of the above

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
| `/` | Overview + progress + gaps |
| `/map` | Four questions + synthesis |
| `/skills` | Skills you have / lack |
| `/notes` | Quick freeform notes |

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint
