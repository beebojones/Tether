// SyncTransport: the seam between Tether and whatever moves bytes between machines.
// v1 ships FolderTransport (a OneDrive/SharePoint-synced folder). The interface is
// deliberately dumb — append-only batches out, batches in — so a future Azure SQL /
// Dataverse / internal API transport slots in without touching merge logic.

import fs from 'node:fs';
import path from 'node:path';
import type { Op } from '../../shared/types';

export interface PeerInfo {
  deviceId: string;
  userName: string | null;
  lastSeenAt: string | null;
}

export interface OpBatchFile {
  deviceId: string;
  fileName: string; // sortable, unique per device
  ops: Op[];
}

export interface SyncTransport {
  /** Human-readable location for the UI ("where is my data"). */
  location(): string;
  /** True when the backing medium is reachable right now. */
  available(): boolean;
  /** Publish a batch of this device's ops. Must be atomic (all-or-nothing visible). */
  publishOps(deviceId: string, batchName: string, ops: Op[]): Promise<void>;
  /** List peer batch file names (sorted ascending) newer than `afterFile` for each peer. */
  listPeerBatches(ownDeviceId: string, afterFileByDevice: Map<string, string | null>): Promise<{ deviceId: string; fileName: string }[]>;
  /** Fetch one batch. */
  fetchBatch(deviceId: string, fileName: string): Promise<Op[]>;
  /** Announce presence (own file only — no write contention). */
  announce(deviceId: string, userName: string): Promise<void>;
  /** All announced devices. */
  listPeers(): Promise<PeerInfo[]>;
  /** Store an attachment blob content-addressed by sha256. Returns true if newly stored. */
  putBlob(sha256: string, data: Buffer): Promise<boolean>;
  /** Fetch an attachment blob, null if not (yet) present. */
  getBlob(sha256: string): Promise<Buffer | null>;
}

/**
 * FolderTransport — shared-folder layout:
 *   <root>/ops/<deviceId>/00000000001.jsonl   op batches, one JSON op per line
 *   <root>/ops/<deviceId>/device.json          presence + identity
 *   <root>/blobs/<aa>/<sha256>                 content-addressed attachments
 *
 * Correctness rules:
 * - A device writes ONLY under its own ops/<deviceId>/ directory → no write contention,
 *   no shared-file locking, no SQLite-over-OneDrive corruption class.
 * - Files are written to a temp name then renamed → readers never see partial batches.
 * - Batches are immutable once published.
 */
export class FolderTransport implements SyncTransport {
  constructor(private root: string) {}

  location(): string {
    return this.root;
  }

  available(): boolean {
    try {
      fs.mkdirSync(path.join(this.root, 'ops'), { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  private opsDir(deviceId: string): string {
    return path.join(this.root, 'ops', deviceId);
  }

  async publishOps(deviceId: string, batchName: string, ops: Op[]): Promise<void> {
    const dir = this.opsDir(deviceId);
    fs.mkdirSync(dir, { recursive: true });
    const finalPath = path.join(dir, batchName);
    const tmpPath = finalPath + '.tmp';
    const lines = ops.map((o) => JSON.stringify(o)).join('\n') + '\n';
    fs.writeFileSync(tmpPath, lines, 'utf8');
    fs.renameSync(tmpPath, finalPath);
  }

  async listPeerBatches(
    ownDeviceId: string,
    afterFileByDevice: Map<string, string | null>,
  ): Promise<{ deviceId: string; fileName: string }[]> {
    const opsRoot = path.join(this.root, 'ops');
    if (!fs.existsSync(opsRoot)) return [];
    const out: { deviceId: string; fileName: string }[] = [];
    for (const dev of fs.readdirSync(opsRoot, { withFileTypes: true })) {
      if (!dev.isDirectory() || dev.name === ownDeviceId) continue;
      const after = afterFileByDevice.get(dev.name) ?? null;
      const files = fs
        .readdirSync(path.join(opsRoot, dev.name))
        .filter((f) => f.endsWith('.jsonl'))
        .sort();
      for (const f of files) {
        if (after && f <= after) continue;
        out.push({ deviceId: dev.name, fileName: f });
      }
    }
    return out;
  }

  async fetchBatch(deviceId: string, fileName: string): Promise<Op[]> {
    const p = path.join(this.opsDir(deviceId), fileName);
    const text = fs.readFileSync(p, 'utf8');
    const ops: Op[] = [];
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      ops.push(JSON.parse(trimmed) as Op);
    }
    return ops;
  }

  async announce(deviceId: string, userName: string): Promise<void> {
    const dir = this.opsDir(deviceId);
    fs.mkdirSync(dir, { recursive: true });
    const p = path.join(dir, 'device.json');
    const tmp = p + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify({ deviceId, userName, lastSeenAt: new Date().toISOString() }), 'utf8');
    fs.renameSync(tmp, p);
  }

  async listPeers(): Promise<PeerInfo[]> {
    const opsRoot = path.join(this.root, 'ops');
    if (!fs.existsSync(opsRoot)) return [];
    const peers: PeerInfo[] = [];
    for (const dev of fs.readdirSync(opsRoot, { withFileTypes: true })) {
      if (!dev.isDirectory()) continue;
      const p = path.join(opsRoot, dev.name, 'device.json');
      if (!fs.existsSync(p)) {
        peers.push({ deviceId: dev.name, userName: null, lastSeenAt: null });
        continue;
      }
      try {
        const info = JSON.parse(fs.readFileSync(p, 'utf8')) as PeerInfo;
        peers.push({ deviceId: dev.name, userName: info.userName ?? null, lastSeenAt: info.lastSeenAt ?? null });
      } catch {
        peers.push({ deviceId: dev.name, userName: null, lastSeenAt: null });
      }
    }
    return peers;
  }

  async putBlob(sha256: string, data: Buffer): Promise<boolean> {
    const dir = path.join(this.root, 'blobs', sha256.slice(0, 2));
    const p = path.join(dir, sha256);
    if (fs.existsSync(p)) return false;
    fs.mkdirSync(dir, { recursive: true });
    const tmp = p + '.tmp-' + process.pid;
    fs.writeFileSync(tmp, data);
    try {
      fs.renameSync(tmp, p);
    } catch {
      fs.rmSync(tmp, { force: true }); // peer won the race; content-addressed so identical
    }
    return true;
  }

  async getBlob(sha256: string): Promise<Buffer | null> {
    const p = path.join(this.root, 'blobs', sha256.slice(0, 2), sha256);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p);
  }
}
