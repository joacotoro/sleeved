# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Sleeved** — a personal MTG collection and deck tracker. Users manage their physical card inventory and assign cards to decks, with the app tracking how many copies are "free" (unassigned).

## Commands

### Development (from repo root)

```bash
npm run dev              # Start both server and client concurrently
npm run dev:server       # Server only (port 3000)
npm run dev:client       # Client only (port 5173)
npm run install:all      # Install deps for both workspaces
```

### Server (from `server/`)

```bash
npm run dev              # tsx watch with .env (hot reload)
npm run db:generate      # Generate Drizzle migration files
npm run db:migrate       # Run migrations (tsx src/db/migrate.ts)
npm run db:studio        # Open Drizzle Studio GUI
npm run build            # tsc compile to dist/
```

### Client (from `client/`)

```bash
npm run dev              # Vite dev server
npm run build            # Production build
```

## Architecture

```
magic-tracker/
├── server/              # Express + TypeScript + Drizzle ORM
│   └── src/
│       ├── db/
│       │   ├── index.ts     # SQLite connection (better-sqlite3), initDB(), WAL mode
│       │   ├── schema.ts    # Drizzle table definitions
│       │   └── migrate.ts   # Migration runner
│       ├── middleware/
│       │   └── auth.ts      # JWT requireAuth, generateToken, AuthRequest type
│       ├── routes/
│       │   ├── auth.ts      # Register, login, Google OAuth, email verify, password reset
│       │   ├── cards.ts     # Card CRUD + quantity tracking
│       │   ├── decks.ts     # Deck CRUD + card listing
│       │   ├── assignments.ts  # Deck-card assignments (deck_cards table)
│       │   ├── import.ts    # Bulk deck import (Moxfield/text format)
│       │   └── scryfall.ts  # Proxy for Scryfall API search
│       └── index.ts         # Express app bootstrap
└── client/              # React 18 + Vite + Tailwind CSS
    └── src/
        ├── api/client.js    # All API calls (single fetch wrapper, JWT from localStorage)
        ├── context/
        │   └── AuthContext.jsx  # JWT stored in localStorage, decoded on init
        ├── pages/           # One component per route
        └── components/
            ├── cards/       # Card-related components
            ├── decks/       # Deck-related components
            └── ui/          # Shared UI (Layout, Spinner, Badge, etc.)
```

### Database

SQLite file at `server/mtg-tracker.db`. Schema managed via `initDB()` (inline CREATE TABLE IF NOT EXISTS + ALTER TABLE migrations). No external DB required.

Tables: `users`, `cards`, `decks`, `deck_cards`.

### Key business logic

- **`quantity_free`** is computed, not stored: `quantity_owned - SUM(deck_cards.quantity)`. Computed in `GET /api/cards` and `GET /api/cards/:id/decks`.
- **Cards are unique per user per scryfall_id** (`UNIQUE(user_id, scryfall_id)`). Attempting to add a duplicate returns 409.
- **Cannot delete a card assigned to any deck** — must remove assignments first.
- **Cannot reduce `quantity_owned` below total assigned copies**.
- `is_sideboard` boolean on `deck_cards` separates mainboard from sideboard within a deck.

### Auth

JWT-based, 7-day expiry. Token stored in `localStorage`. The `requireAuth` middleware reads `Authorization: Bearer <token>`. Google OAuth flow redirects to `/auth/callback` on the frontend. Email verification and password reset use tokens stored in the `users` table with expiry timestamps.

### Environment variables (server)

- `JWT_SECRET` — defaults to `"dev-secret-change-in-prod"`
- `PORT` — defaults to `3000`
- `FRONTEND_URL` — defaults to `"http://localhost:5173"` (CORS origin)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — for OAuth
- Resend API key for transactional email

### Frontend conventions

- **Design system**: dark "vault" theme via Tailwind custom colors (`vault-*`). Fonts: Cinzel (headings) + Outfit (body). Custom utilities in `index.css`: `.card-hover`, `.gold-top-accent`, `.input-vault`, `.text-gold-shimmer`, `.stagger-1..4`.
- **No state management library** — local `useState`/`useEffect` per page, shared auth via `AuthContext`.
- Vite proxies are not configured; the client calls `/api/*` paths and Vite is expected to be proxied or run alongside the server in production.
