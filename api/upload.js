// api/upload.js
import { put } from '@vercel/blob';
import path from 'path';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.body ?? {};
    if (!url) return res.status(400).json({ error: 'Missing url in body' });

    // basic URL validation
    let target;
    try {
      target = new URL(url);
      if (!['http:', 'https:'].includes(target.protocol)) throw new Error();
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Prevent obvious SSRF: optional domain whitelist (uncomment to use)
    // const allowed = ['example.com','i.imgur.com']; // add domains you trust
    // if (!allowed.includes(target.hostname)) return res.status(403).json({ error: 'Domain not allowed' });

    // Fetch the target resource server-side
    const fetchRes = await fetch(url, { redirect: 'follow' });

    if (!fetchRes.ok) {
      return res.status(502).json({ error: `Upstream fetch failed: ${fetchRes.status}` });
    }

    // Optional: check content-length to avoid huge uploads
    const cl = fetchRes.headers.get('content-length');
    const MAX_BYTES = 10 * 1024 * 1024; // 10 MB limit
    if (cl && Number(cl) > MAX_BYTES) {
      return res.status(413).json({ error: 'File too large' });
    }

    // Read as ArrayBuffer -> Buffer
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Derive a filename from URL or fallback
    const base = path.basename(target.pathname) || 'file';
    const ext = path.extname(base) || '';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;

    // Upload to Vercel Blob (access public)
    const blob = await put(safeName, buffer, { access: 'public' });

    // blob.url is the uploaded public URL
    return res.status(200).json({
      ok: true,
      blobUrl: blob.url,
      // small custom scheme if you want it
      bnlob: `bnlob:${blob.url}`
    });

  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
