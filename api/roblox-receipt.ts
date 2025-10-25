import type { VercelRequest, VercelResponse } from '@vercel/node';

const db = {
  entitlements: new Map<string, { receiptId: string; ts: number }>(),
};

export const store = db;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const auth = String(req.headers.authorization || '');
  if (auth !== `Bearer ${process.env.API_KEY}`) return res.status(401).json({ error: 'unauthorized' });

  const { userId, productId, receiptId } = req.body || {};
  if (!userId || !productId || !receiptId) return res.status(400).json({ error: 'invalid_payload' });

  db.entitlements.set(`${userId}:${productId}`, { receiptId, ts: Date.now() });
  res.json({ ok: true });
}
