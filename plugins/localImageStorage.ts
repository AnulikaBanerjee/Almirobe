import fs from 'node:fs';
import path from 'node:path';
import type { Connect } from 'vite';
import type { Plugin } from 'vite';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
function wardrobeFileForProfile(profileId: string): string {
  const safe = profileId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(DATA_DIR, `wardrobe-data-${safe}.json`);
}

function profileIdFromUrl(url: string): string {
  const query = url.includes('?') ? url.split('?')[1] : '';
  const params = new URLSearchParams(query);
  return params.get('profile') ?? 'default';
}

function ensureDataDirs() {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function sendJson(res: Connect.ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

/**
 * Dev-server middleware: persist images and wardrobe JSON under data/.
 * Survives browser refresh, port changes (same machine), and dev-server restarts.
 */
export function localImageStoragePlugin(): Plugin {
  return {
    name: 'local-image-storage',
    configureServer(server) {
      ensureDataDirs();

      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';

        // --- Wardrobe JSON persistence ---
        if (url === '/api/wardrobe' || url.startsWith('/api/wardrobe?')) {
          const profileId = profileIdFromUrl(url);
          const wardrobeFile = wardrobeFileForProfile(profileId);

          if (req.method === 'GET') {
            try {
              if (!fs.existsSync(wardrobeFile)) {
                sendJson(res, 200, null);
                return;
              }
              const raw = fs.readFileSync(wardrobeFile, 'utf8');
              sendJson(res, 200, JSON.parse(raw));
            } catch {
              sendJson(res, 500, { error: 'Could not read wardrobe data' });
            }
            return;
          }

          if (req.method === 'POST') {
            void readBody(req)
              .then((body) => {
                ensureDataDirs();
                fs.writeFileSync(wardrobeFile, body, 'utf8');
                sendJson(res, 200, { ok: true });
              })
              .catch(() => {
                sendJson(res, 500, { error: 'Could not save wardrobe data' });
              });
            return;
          }

          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        // --- Image uploads ---
        if (url === '/api/images' || url.startsWith('/api/images?')) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method not allowed');
            return;
          }

          void readBody(req)
            .then((body) => {
              const parsed = JSON.parse(body) as { data?: string };
              if (!parsed.data?.startsWith('data:image/')) {
                sendJson(res, 400, { error: 'Invalid image data' });
                return;
              }

              const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(parsed.data);
              if (!match) {
                sendJson(res, 400, { error: 'Malformed data URL' });
                return;
              }

              const mime = match[1];
              const ext =
                mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
              const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              const fileName = `${id}.${ext}`;

              ensureDataDirs();
              fs.writeFileSync(path.join(UPLOAD_DIR, fileName), Buffer.from(match[2], 'base64'));

              sendJson(res, 200, { id, url: `/uploads/${fileName}` });
            })
            .catch(() => {
              sendJson(res, 500, { error: 'Upload failed' });
            });
          return;
        }

        // --- Serve uploaded images ---
        if (url.startsWith('/uploads/')) {
          const fileName = path.basename(url.split('?')[0]);
          if (!fileName || fileName.includes('..')) {
            res.statusCode = 400;
            res.end('Invalid path');
            return;
          }
          const filePath = path.join(UPLOAD_DIR, fileName);
          if (!fs.existsSync(filePath)) {
            next();
            return;
          }
          const ext = path.extname(fileName).toLowerCase();
          const contentType =
            ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          fs.createReadStream(filePath).pipe(res);
          return;
        }

        next();
      });
    },
  };
}
