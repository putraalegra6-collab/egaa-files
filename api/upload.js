/**
 * =============================================================
 *  EGAAFILES — Upload API
 *  Author  : Egaa
 *  Storage : Vercel Blob
 * =============================================================
 */

import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '100mb'
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024,
      multiples: false,
      keepExtensions: true
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) return res.status(400).json({ ok: false, error: 'No file uploaded' });

    const originalName = file.originalFilename || 'file';
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
    const uniqueName = `${Date.now()}_${safeName}`;

    const fileBuffer = fs.readFileSync(file.filepath);

    const blob = await put(`uploads/${uniqueName}`, fileBuffer, {
      access: 'public',
      contentType: file.mimetype || 'application/octet-stream',
      addRandomSuffix: false
    });

    try { fs.unlinkSync(file.filepath); } catch {}

    return res.status(200).json({
      ok: true,
      url: blob.url,
      name: originalName,
      size: file.size,
      type: file.mimetype || 'unknown',
      uploadedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error('[Upload Error]', err);
    return res.status(500).json({ ok: false, error: err.message || 'Upload failed' });
  }
}
