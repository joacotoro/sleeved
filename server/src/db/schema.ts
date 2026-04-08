import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash"),
  name: text("name").notNull(),
  avatar_url: text("avatar_url"),
  provider: text("provider").default("local"),
  google_id: text("google_id").unique(),
  is_verified: integer("is_verified", { mode: "boolean" }).default(false),
  verification_token: text("verification_token"),
  verification_token_expires_at: text("verification_token_expires_at"),
  reset_token: text("reset_token"),
  reset_token_expires_at: text("reset_token_expires_at"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const cards = sqliteTable("cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  scryfall_id: text("scryfall_id").notNull(),
  name: text("name").notNull(),
  set_code: text("set_code"),
  set_name: text("set_name"),
  collector_number: text("collector_number"),
  image_uri: text("image_uri"),
  image_uri_small: text("image_uri_small"),
  quantity_owned: integer("quantity_owned").notNull(),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const decks = sqliteTable("decks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  user_id: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  format: text("format"),
  description: text("description"),
  created_at: text("created_at").default(sql`(datetime('now'))`),
});

export const deck_cards = sqliteTable("deck_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deck_id: integer("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  card_id: integer("card_id")
    .notNull()
    .references(() => cards.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull(),
  is_sideboard: integer("is_sideboard", { mode: "boolean" }).default(false),
});
