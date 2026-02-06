import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasDbConfig, sql } from "./db";
import { normalizeNome } from "../services/normalize";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
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
    // Atualiza todos os nomes para caixa alta e sem acento
    await sql`
      UPDATE cooperados
      SET name = upper(unaccent(name))
      WHERE name IS NOT NULL
    `;
    res.status(200).json({ message: `Nomes atualizados com sucesso!` });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "Unknown error" });
  }
}
