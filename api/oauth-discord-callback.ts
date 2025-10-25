import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { store as db } from './session';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = String(req.query.code || '');
  const redirect = `${process.env.BASE_URL}/api/oauth-discord-callback`;

  // Exchange code for token
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirect,
    }),
  });
  const token = await tokenRes.json() as { access_token: string };

  // Fetch Discord user
  const userRes = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const discordUser = await userRes.json() as { id: string; username: string; avatar: string };

  // Resolve Roblox ID via Bloxlink API
  const bloxRes = await fetch(`https://v3.blox.link/developer/discord/${discordUser.id}`, {
    headers: { Authorization: `Bearer ${process.env.BLOXLINK_API_KEY}` },
  });
  const bloxData = await bloxRes.json();
  const robloxUserId = bloxData.robloxId;

  // Store session
  const profile = {
    discordId: discordUser.id,
    username: discordUser.username,
    avatar: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
    robloxUserId,
  };
  const sid = crypto.randomUUID();
  db.sessions.set(sid, profile);
  res.setHeader('Set-Cookie', `ws_session=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax`);

  res.redirect('/');
}
