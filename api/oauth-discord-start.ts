import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const redirect = encodeURIComponent(`${process.env.BASE_URL}/api/oauth-discord-callback`);
  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=identify`;
  res.redirect(url);
}
