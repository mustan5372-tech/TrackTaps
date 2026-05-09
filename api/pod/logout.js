import { serialize } from 'cookie';

export default async function handler(req, res) {
  const cookie = serialize('pod_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/'
  });

  res.setHeader('Set-Cookie', cookie);
  return res.status(200).json({ success: true });
}
