export interface Card {
  id: number;
  scryfall_id: string;
  name: string;
  set_code: string | null;
  set_name: string | null;
  collector_number: string | null;
  image_uri: string | null;
  image_uri_small: string | null;
  quantity_owned: number;
  created_at: string | null;
}

export interface CardWithAssignments extends Card {
  quantity_assigned: number;
  quantity_free: number;
  deck_count: number;
}

export interface Deck {
  id: number;
  name: string;
  format: string | null;
  description: string | null;
  created_at: string | null;
}

export interface DeckWithCount extends Deck {
  card_count: number;
}

export interface DeckCard {
  id: number;
  deck_id: number;
  card_id: number;
  quantity: number;
  is_sideboard: boolean;
}

export interface DeckCardWithCard extends DeckCard {
  card: Card;
}

export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  image_uris?: {
    normal: string;
    small: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal: string;
      small: string;
    };
  }>;
}

export interface ImportLine {
  quantity: number;
  name: string;
  is_sideboard: boolean;
}

export interface ImportResult {
  deck: Deck;
  new_cards: Array<{
    scryfall_id: string;
    name: string;
    image_uri_small: string | null;
    quantity_in_deck: number;
  }>;
  errors: string[];
}

export const MTG_FORMATS = [
  "Standard",
  "Pioneer",
  "Modern",
  "Legacy",
  "Vintage",
  "Commander",
  "Pauper",
  "Draft",
] as const;

export type MTGFormat = (typeof MTG_FORMATS)[number];
