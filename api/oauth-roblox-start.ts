import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const STATE_COOKIE = 'ws_state';
const VERIFIER_COOKIE = 'ws_verifier';
const SESS_COOKIE = 'ws_session';

function setCookie(res: VercelResponse, name: string, value: string, maxAgeMs = 600000) {
  res.setHeader('Set-Cookie', `${name}=${value}; Max-Age=${Math.floor(maxAgeMs/1000)}; Path=/; Secure; HttpOnly; SameSite=Lax`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.ROBLOX_CLIENT_ID!;
  const base = process.env.BASE_URL!;
  const { redirect, code_challenge } = req.query as { redirect?: string; code_challenge?: string };

  const state = crypto.randomUUID();
  setCookie(res, STATE_COOKIE, state);
  if (req.query.verifier) setCookie(res, VERIFIER_COOKIE, String(req.query.verifier));

  if (redirect) setCookie(res, 'post_login_redirect', redirect);

  const url = new URL('https://authorize.roblox.com/');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', `${base}/api/oauth-roblox-callback`);
  url.searchParams.set('scope', 'openid profile');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', code_challenge || '');
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('step', 'permissionRequest');

  res.status(302).setHeader('Location', url.toString()).end();
}
