import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasDbConfig, sql } from "../services/db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
  if (!hasDbConfig()) {
    res.status(500).json({ error: "Missing DATABASE_URL or DATABASE_AUTH_TOKEN env var" });
    return;
  }

  try {
    if (req.method === "GET") {
      // Garantir colunas esperadas em bases antigas
      try { await sql`ALTER TABLE cooperados ADD COLUMN IF NOT EXISTS matricula text`; } catch {}
      try { await sql`ALTER TABLE cooperados ADD COLUMN IF NOT EXISTS specialty text`; } catch {}
      try { await sql`ALTER TABLE cooperados ADD COLUMN IF NOT EXISTS status text`; } catch {}
      try { await sql`ALTER TABLE cooperados ADD COLUMN IF NOT EXISTS updated_at text DEFAULT CURRENT_TIMESTAMP`; } catch {}

      let rows: any[] = [];
      try {
        rows = await sql`SELECT id, name, cpf, email, phone, specialty, matricula, status, updated_at FROM cooperados ORDER BY updated_at DESC LIMIT 200`;
      } catch {
        rows = await sql`SELECT id, name, cpf, email, phone, specialty, matricula, status, updated_at FROM cooperados LIMIT 200`;
      }
      res.status(200).json(rows);
      return;
    }

    if (req.method === "POST") {
      const { name, cpf, email, phone } = req.body || {};
      if (!name) {
        res.status(400).json({ error: "Missing name" });
        return;
      }
      const rows = await sql`INSERT INTO cooperados (name, cpf, email, phone) VALUES (${name}, ${cpf}, ${email}, ${phone}) RETURNING id`;
      res.status(201).json({ id: rows[0]?.id });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
