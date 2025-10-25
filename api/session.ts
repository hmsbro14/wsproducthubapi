import type { VercelRequest, VercelResponse } from '@vercel/node';

const SESS_COOKIE = 'ws_session';
const db = {
  sessions: new Map<string, { userId: string; username: string; avatar: string }>(),
};

// Helper to retrieve session
function getSession(req: VercelRequest) {
  const cookie = (req.headers.cookie || '').split(';').find(c => c.trim().startsWith(`${SESS_COOKIE}=`));
  if (!cookie) return null;
  const sid = cookie.split('=')[1];
  return db.sessions.get(sid) || null;
}

// Exported store for other endpoints (hacky but simple)
export const store = db;
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sess = getSession(req);
  if (!sess) return res.status(401).json({ error: 'no_session' });
  res.json(sess);
}
