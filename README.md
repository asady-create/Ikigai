# Ikigai

A personal purpose-discovery and reflection tool inspired by Marc Andreessen’s philosophy.

> The world is a very malleable place. If you know what you want, and you want it badly enough… the world will reconfigure itself around you.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** + custom dark zinc theme
- **Framer Motion** + **Lucide** icons
- **localStorage** only — privacy-first, no backend for MVP

## What's shipped

| Route | Status |
|-------|--------|
| `/` Home | Full — hero quote, momentum, nav cards, daily prompt |
| `/reflections` | Full — prompt library, journal editor, energy/clarity, AI insights placeholder, Markdown export |
| `/canvas` | Full — Ikigai quadrants, core values chips, vision generator |
| `/goals` | Stub — ready to extend |
| `/coach` | Stub — ready to extend |
| `/review` | Stub — ready to extend |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
src/
  app/                  # Routes (App Router)
  components/
    home/               # Dashboard
    reflections/        # Core reflection UX
    layout/             # App shell + nav
    providers/          # localStorage-backed context
    ui/                 # Lightweight shadcn-style primitives
    shared/
  lib/
    types.ts            # Domain types
    storage.ts          # Persistence + export
    prompts.ts          # Reflection prompt library
    quotes.ts           # Rotating Andreessen / pmarca quotes
    ai-placeholder.ts   # Swap for OpenAI/Claude later
    utils.ts
```

### Persistence

All data is stored under `ikigai:v1` in `localStorage`. See `src/lib/storage.ts`.

### Wiring real AI

Replace the bodies of `analyzeReflections` and `generateNextAction` in `src/lib/ai-placeholder.ts` with API calls. Keep the return shapes so the UI stays stable.

## Scripts

- `npm run dev` — Turbopack dev server
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint

## Design notes

Dark zinc/neutral by default. Display font: **Syne**. Body: **DM Sans**. Amber accent for CTAs and energy signals. Tone: direct, optimistic, no-BS.
