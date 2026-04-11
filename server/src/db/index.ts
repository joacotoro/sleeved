import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

const sqlite = new Database(process.env.DB_PATH ?? "./mtg-tracker.db");

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function initDB() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL DEFAULT '',
      avatar_url TEXT,
      provider TEXT DEFAULT 'local',
      google_id TEXT UNIQUE,
      is_verified INTEGER DEFAULT 0,
      verification_token TEXT,
      verification_token_expires_at TEXT,
      reset_token TEXT,
      reset_token_expires_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      scryfall_id TEXT NOT NULL,
      name TEXT NOT NULL,
      set_code TEXT,
      set_name TEXT,
      collector_number TEXT,
      image_uri TEXT,
      image_uri_small TEXT,
      quantity_owned INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, scryfall_id)
    );

    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      format TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deck_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
      card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      is_sideboard INTEGER DEFAULT 0
    );
  `);

  // Migrations for existing installations
  const migrations = [
    `ALTER TABLE cards ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE decks ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE users ADD COLUMN email TEXT`,
    `ALTER TABLE users ADD COLUMN name TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN avatar_url TEXT`,
    `ALTER TABLE users ADD COLUMN provider TEXT DEFAULT 'local'`,
    `ALTER TABLE users ADD COLUMN google_id TEXT`,
    `ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN verification_token TEXT`,
    `ALTER TABLE users ADD COLUMN verification_token_expires_at TEXT`,
    `ALTER TABLE users ADD COLUMN reset_token TEXT`,
    `ALTER TABLE users ADD COLUMN reset_token_expires_at TEXT`,
  ];
  for (const migration of migrations) {
    try { sqlite.exec(migration); } catch {}
  }
}
