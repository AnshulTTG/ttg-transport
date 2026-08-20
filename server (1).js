/* TTG — The Guianas Transport & Logistics
   Server: Express + Neon (PostgreSQL) + JWT login
   Omgevingsvariabelen (op Render instellen):
   - DATABASE_URL  → de connection string van Neon
   - JWT_SECRET    → een lang willekeurig geheim (zelf verzinnen)
*/
const express = require("express");
const path = require("path");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json({ limit: "10mb" }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const SECRET = process.env.JWT_SECRET || "verander-dit-geheim-op-render";

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    )`);
  const r = await pool.query("SELECT 1 FROM app_state WHERE id = 1");
  if (!r.rowCount) {
    // Eerste start: alleen de admin-gebruiker; de app vult de rest van de
    // startgegevens (assumptions, klassen, routes, …) aan bij de eerste login.
    const initial = {
      users: [
        { id: "U1", naam: "Dinesh", gebruikersnaam: "admin", pincode: "1234", rol: "Admin", status: "Actief" },
      ],
    };
    await pool.query("INSERT INTO app_state (id, data) VALUES (1, $1::jsonb)", [JSON.stringify(initial)]);
    console.log("Database geïnitialiseerd met standaard admin (admin / 1234) — wijzig de pincode direct!");
  }
}

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!t) return res.status(401).json({ error: "Geen token" });
  try {
    req.user = jwt.verify(t, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Ongeldig of verlopen token" });
  }
}

app.post("/api/login", async (req, res) => {
  try {
    const { gebruikersnaam, pincode } = req.body || {};
    const r = await pool.query("SELECT data FROM app_state WHERE id = 1");
    const users = (r.rows[0] && r.rows[0].data && r.rows[0].data.users) || [];
    const u = users.find(
      (x) =>
        String(x.gebruikersnaam).toLowerCase() === String(gebruikersnaam || "").trim().toLowerCase() &&
        String(x.pincode) === String(pincode) &&
        x.status === "Actief"
    );
    if (!u) return res.status(401).json({ error: "Onjuiste gebruikersnaam of pincode" });
    const token = jwt.sign({ gebruikersnaam: u.gebruikersnaam, rol: u.rol }, SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: u.id, naam: u.naam, gebruikersnaam: u.gebruikersnaam, rol: u.rol, status: u.status } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Serverfout bij inloggen" });
  }
});

app.get("/api/me", auth, (req, res) => {
  res.json({ gebruikersnaam: req.user.gebruikersnaam, rol: req.user.rol });
});

app.get("/api/state", auth, async (req, res) => {
  try {
    const r = await pool.query("SELECT data FROM app_state WHERE id = 1");
    if (!r.rowCount) return res.status(404).json({ error: "Geen data" });
    res.json(r.rows[0].data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Serverfout bij ophalen" });
  }
});

app.put("/api/state", auth, async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO app_state (id, data, updated_at) VALUES (1, $1::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = now()`,
      [JSON.stringify(req.body)]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Serverfout bij opslaan" });
  }
});

app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const port = process.env.PORT || 3000;
init()
  .then(() => app.listen(port, () => console.log("TTG live op poort " + port)))
  .catch((e) => {
    console.error("Kon database niet initialiseren:", e.message);
    process.exit(1);
  });
