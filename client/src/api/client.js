const BASE = "/api";

async function request(method, path, body) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error ?? `Error ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  register: (body) => request("POST", "/auth/register", body),
  login: (body) => request("POST", "/auth/login", body),
  logout: () => request("POST", "/auth/logout"),
  verifyEmail: (token) => request("POST", `/auth/verify-email?token=${token}`),
  forgotPassword: (body) => request("POST", "/auth/forgot-password", body),
  resetPassword: (body) => request("POST", "/auth/reset-password", body),
  resendVerification: (body) => request("POST", "/auth/resend-verification", body),
  getMe: () => request("GET", "/auth/me"),

  // Cards
  getCards: () => request("GET", "/cards"),
  createCard: (body) => request("POST", "/cards", body),
  updateCard: (id, body) => request("PUT", `/cards/${id}`, body),
  deleteCard: (id) => request("DELETE", `/cards/${id}`),
  getCardDecks: (id) => request("GET", `/cards/${id}/decks`),

  // Decks
  getDecks: () => request("GET", "/decks"),
  createDeck: (body) => request("POST", "/decks", body),
  updateDeck: (id, body) => request("PUT", `/decks/${id}`, body),
  deleteDeck: (id) => request("DELETE", `/decks/${id}`),
  getDeckCards: (id) => request("GET", `/decks/${id}/cards`),
  importDeck: (body) => request("POST", "/decks/import", body),

  // Assignments
  createAssignment: (body) => request("POST", "/assignments", body),
  updateAssignment: (id, body) => request("PUT", `/assignments/${id}`, body),
  deleteAssignment: (id) => request("DELETE", `/assignments/${id}`),
  yieldAssignment: (id) => request("POST", `/assignments/${id}/yield`),
  moveAssignment: (body) => request("POST", "/assignments/move", body),
  moveAssignmentTo: (body) => request("POST", "/assignments/move", body),

  // Scryfall
  searchScryfall: (q) => request("GET", `/scryfall/search?q=${encodeURIComponent(q)}`),
  getScryfallCard: (id) => request("GET", `/scryfall/card/${id}`),
};
