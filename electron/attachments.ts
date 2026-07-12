// Attachment manager: content-addressed local blob store + metadata rows.
// Blobs live at <dataDir>/attachments/<aa>/<sha256>; sync copies travel through
// the transport's blob store so the peer can fetch on demand.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Store } from './db/store';
import type { SyncTransport } from './sync/transport';
import type { Attachment } from '../shared/types';

const MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024; // 100 MB guard

export class AttachmentManager {
  constructor(
    private store: Store,
    private dataDir: string,
    private getTransport: () => SyncTransport | null,
  ) {}

  private blobPath(sha256: string): string {
    // sha256 values can arrive from synced records — validate before any path use.
    if (!/^[0-9a-f]{64}$/.test(sha256)) throw new Error('Invalid attachment hash');
    return path.join(this.dataDir, 'attachments', sha256.slice(0, 2), sha256);
  }

  async addFromPath(itemId: string, sourcePath: string, description: string | null): Promise<Attachment> {
    const stat = fs.statSync(sourcePath);
    if (!stat.isFile()) throw new Error('Not a file');
    if (stat.size > MAX_ATTACHMENT_BYTES) throw new Error('File exceeds the 100 MB attachment limit');
    const data = fs.readFileSync(sourcePath);
    const sha256 = crypto.createHash('sha256').update(data).digest('hex');
    const dest = this.blobPath(sha256);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, data);

    const att: Attachment = {
      id: crypto.randomUUID(),
      itemId,
      filename: path.basename(sourcePath),
      mime: mimeFromName(sourcePath),
      size: stat.size,
      sha256,
      description,
      uploadedBy: this.store.actorId,
      createdAt: new Date().toISOString(),
      deleted: 0,
    };
    this.store.db
      .prepare(
        'INSERT INTO attachments(id, item_id, filename, mime, size, sha256, description, uploaded_by, created_at, deleted) VALUES(?,?,?,?,?,?,?,?,?,0)',
      )
      .run(att.id, att.itemId, att.filename, att.mime, att.size, att.sha256, att.description, att.uploadedBy, att.createdAt);
    // Record in oplog so the peer learns about it (private method access via cast — Store owns oplog format).
    (this.store as unknown as { localCreate: (e: string, id: string, r: Record<string, unknown>) => void })
      .localCreate('attachment', att.id, { ...att });

    const transport = this.getTransport();
    if (transport && transport.available()) {
      try {
        await transport.putBlob(sha256, data);
      } catch {
        // Blob upload retried by ensureBlobsPushed on the next sync cycle.
      }
    }
    return att;
  }

  /** Push any local blobs the transport doesn't have yet (retry path). */
  async ensureBlobsPushed(): Promise<void> {
    const transport = this.getTransport();
    if (!transport || !transport.available()) return;
    const rows = this.store.db.prepare('SELECT DISTINCT sha256 FROM attachments WHERE deleted=0').all() as { sha256: string }[];
    for (const r of rows) {
      const p = this.blobPath(r.sha256);
      if (!fs.existsSync(p)) continue;
      if ((await transport.getBlob(r.sha256)) === null) {
        await transport.putBlob(r.sha256, fs.readFileSync(p));
      }
    }
  }

  /** Resolve a local path for an attachment, pulling from the transport if needed. */
  async materialize(attachmentId: string): Promise<string | null> {
    const row = this.store.db.prepare('SELECT sha256, filename FROM attachments WHERE id=? AND deleted=0').get(attachmentId) as
      | { sha256: string; filename: string }
      | undefined;
    if (!row) return null;
    const p = this.blobPath(row.sha256);
    if (!fs.existsSync(p)) {
      const transport = this.getTransport();
      if (!transport) return null;
      const data = await transport.getBlob(row.sha256);
      if (!data) return null;
      const check = crypto.createHash('sha256').update(data).digest('hex');
      if (check !== row.sha256) throw new Error('Attachment integrity check failed');
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, data);
    }
    // Hand callers a real-filename copy so "open with default app" behaves.
    const openDir = path.join(this.dataDir, 'attachments', 'open');
    fs.mkdirSync(openDir, { recursive: true });
    const openPath = path.join(openDir, `${row.sha256.slice(0, 8)}-${sanitize(row.filename)}`);
    if (!fs.existsSync(openPath)) fs.copyFileSync(p, openPath);
    return openPath;
  }

  listFor(itemId: string): Attachment[] {
    const rows = this.store.db
      .prepare('SELECT * FROM attachments WHERE item_id=? AND deleted=0 ORDER BY created_at DESC')
      .all(itemId) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id), itemId: String(r.item_id), filename: String(r.filename), mime: String(r.mime),
      size: Number(r.size), sha256: String(r.sha256),
      description: (r.description as string | null) ?? null,
      uploadedBy: String(r.uploaded_by), createdAt: String(r.created_at), deleted: 0,
    }));
  }

  remove(attachmentId: string): void {
    this.store.db.prepare('UPDATE attachments SET deleted=1 WHERE id=?').run(attachmentId);
    (this.store as unknown as { localSet: (e: string, id: string, f: Record<string, unknown>) => void })
      .localSet('attachment', attachmentId, { deleted: 1 });
  }
}

function sanitize(name: string): string {
  return name.replace(/[^\w.\- ]+/g, '_');
}

function mimeFromName(p: string): string {
  const ext = path.extname(p).toLowerCase();
  const map: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
    '.webp': 'image/webp', '.svg': 'image/svg+xml', '.pdf': 'application/pdf',
    '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain', '.md': 'text/markdown', '.csv': 'text/csv', '.json': 'application/json',
  };
  return map[ext] ?? 'application/octet-stream';
}
