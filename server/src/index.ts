import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { initDB } from "./db/index.js";
import authRouter, { passport } from "./routes/auth.js";
import cardsRouter from "./routes/cards.js";
import decksRouter from "./routes/decks.js";
import assignmentsRouter from "./routes/assignments.js";
import scryfallRouter from "./routes/scryfall.js";
import importRouter from "./routes/import.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again in a minute" },
});

// Initialize DB
initDB();

// Public routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/scryfall", scryfallRouter);

// Protected routes (requireAuth applied inside each router)
app.use("/api/cards", cardsRouter);
app.use("/api/decks/import", importRouter);
app.use("/api/decks", decksRouter);
app.use("/api/assignments", assignmentsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Serve static client files in production
const clientDist = path.resolve(__dirname, "../../../client/dist");
app.use(express.static(clientDist));
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Sleeved server running on http://localhost:${PORT}`);
});
