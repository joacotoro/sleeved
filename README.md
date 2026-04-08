# Sleeved

A personal Magic: The Gathering collection tracker. Keep track of your physical cards, build decks, and always know how many copies of each card are free vs. sleeved up in a deck.

## What it does

- **Collection** — Add cards to your inventory with a quantity. Cards are looked up via the Scryfall API so you get accurate names, set info, and card images.
- **Decks** — Create decks and assign cards from your collection to them (mainboard and sideboard separately). You can also import a deck directly from a Moxfield URL or a plain text decklist.
- **Availability tracking** — For every card in your collection, Sleeved computes how many copies are assigned across all your decks and how many are free to use.
- **Auth** — Accounts with email/password or Google OAuth. Email verification and password reset included.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via Drizzle ORM (better-sqlite3) |
| Auth | JWT + Passport (Google OAuth) |
| Card data | Scryfall API |
| Email | Resend |

## Getting started

### Prerequisites

- Node.js 18+
- A [Resend](https://resend.com) API key (for email)
- A Google OAuth app (optional, for Google login)

### Install dependencies

```bash
npm run install:all
```

### Configure the server

Copy the example env file and fill in your values:

```bash
cp server/.env.example server/.env
```

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-secret-here

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Run in development

```bash
npm run dev
```

This starts both the backend (port 3000) and the frontend (port 5173) concurrently.

Open http://localhost:5173, create an account, and start adding cards.

## Database

SQLite file is created automatically at `server/mtg-tracker.db` on first run. No setup needed.

To browse the database with a GUI:

```bash
cd server && npm run db:studio
```
