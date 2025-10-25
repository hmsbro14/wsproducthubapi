import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import crypto from 'crypto';
import { store as db } from './session';

const STATE_COOKIE = 'ws_state';
const VERIFIER_COOKIE = 'ws_verifier';
const SESS_COOKIE = 'ws_session';

function readCookie(req: VercelRequest, name: string) {
  const cookie = (req.headers.cookie || '').split(';').find(c => c.trim().startsWith(`${name}=`));
  if (!cookie) return null;
  return cookie.split('=')[1];
}
function setCookie(res: VercelResponse, name: string, value: string, maxAgeMs = 604800000) {
  res.setHeader('Set-Cookie', `${name}=${value}; Max-Age=${Math.floor(maxAgeMs/1000)}; Path=/; Secure; HttpOnly; SameSite=Lax`);
}
function clearCookie(res: VercelResponse, name: string) {
  res.setHeader('Set-Cookie', `${name}=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Lax`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = String(req.query.code || '');
  const state = String(req.query.state || '');
  const expectedState = readCookie(req, STATE_COOKIE);
  if (!code || !state || state !== expectedState) return res.status(400).send('Invalid state');

  const codeVerifier = readCookie(req, VERIFIER_COOKIE) || '';
  const tokenRes = await fetch('https://apis.roblox.com/oauth/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.ROBLOX_CLIENT_ID!,
      client_secret: process.env.ROBLOX_CLIENT_SECRET!,
      redirect_uri: `${process.env.BASE_URL}/api/oauth-roblox-callback`,
      code_verifier: codeVerifier,
    }).toString(),
  });
  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    return res.status(400).send('Token exchange failed: ' + text);
  }
  const token = await tokenRes.json() as { access_token: string };

  const uiRes = await fetch('https://apis.roblox.com/oauth/v1/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const userinfo = await uiRes.json() as { sub: string; name: string; picture: string };

  const sid = crypto.randomUUID();
  db.sessions.set(sid, { userId: userinfo.sub, username: userinfo.name, avatar: userinfo.picture });
  setCookie(res, SESS_COOKIE, sid);

  clearCookie(res, STATE_COOKIE);
  clearCookie(res, VERIFIER_COOKIE);

  const postRedirect = readCookie(req, 'post_login_redirect') || '/';
  res.status(302).setHeader('Location', postRedirect).end();
}
