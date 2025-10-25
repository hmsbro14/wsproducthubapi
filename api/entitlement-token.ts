import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { store as sessions } from './session';
import { store as receipts } from './roblox-receipt';

const SESS_COOKIE = 'ws_session';

function readCookie(req: VercelRequest, name: string) {
  const cookie = (req.headers.cookie || '').split(';').find(c => c.trim().startsWith(`${name}=`));
  if (!cookie) return null;
  return cookie.split('=')[1];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sid = readCookie(req, SESS_COOKIE);
  const sess = sid ? sessions.sessions.get(sid) : null;
  if (!sess) return res.status(401).json({ error: 'no_session' });

  const productId = String(req.query.productId || '');
  if (!productId) return res.status(400).json({ error: 'missing_productId' });

  const has = receipts.entitlements.get(`${sess.userId}:${productId}`);
  if (!has) return res.status(403).json({ error: 'no_entitlement' });

  const base = process.env.PRODUCT_PUBLIC_ASSETS || 'https://cdn.yourdomain.com/downloads';
  const ttl = 300;
  const token = crypto.randomBytes(16).toString('hex');
  const url = `${base}/${productId}.zip?u=${sess.userId}&t=${token}&ttl=${ttl}`;

  res.json({ url });
}
