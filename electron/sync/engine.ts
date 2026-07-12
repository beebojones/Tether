// SyncEngine: periodic + event-driven export/import loop over a SyncTransport.
// Local-first: the app is fully usable with sync disabled or the folder offline;
// ops queue in the oplog and flush when the transport returns.

import type { Store } from '../db/store';
import { getMeta, setMeta } from '../db/db';
import type { SyncTransport } from './transport';
import type { SyncStatus, SyncStatusState } from '../../shared/types';

const EXPORT_DEBOUNCE_MS = 1_500;
const POLL_INTERVAL_MS = 5_000;

export class SyncEngine {
  private transport: SyncTransport | null = null;
  private timer: NodeJS.Timeout | null = null;
  private exportTimer: NodeJS.Timeout | null = null;
  private running = false;
  private current: Promise<void> = Promise.resolve();
  private state: SyncStatusState = 'disabled';
  private lastError: string | null = null;
  private lastSyncAt: string | null = null;
  private userName: string;
  private onStatus: (s: SyncStatus) => void;

  constructor(
    private store: Store,
    userName: string,
    onStatus: (s: SyncStatus) => void,
  ) {
    this.userName = userName;
    this.onStatus = onStatus;
  }

  setTransport(transport: SyncTransport | null): void {
    this.transport = transport;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (transport) {
      this.state = 'idle';
      this.timer = setInterval(() => void this.cycle(), POLL_INTERVAL_MS);
      void this.cycle();
    } else {
      this.state = 'disabled';
      this.emitStatus();
    }
  }

  /** Call after any local mutation — debounced export so rapid edits batch. */
  noteLocalChange(): void {
    if (!this.transport) return;
    if (this.exportTimer) clearTimeout(this.exportTimer);
    this.exportTimer = setTimeout(() => void this.cycle(), EXPORT_DEBOUNCE_MS);
  }

  async cycle(): Promise<void> {
    if (!this.transport || this.running) return this.current;
    this.running = true;
    let release!: () => void;
    this.current = new Promise((r) => (release = r));
    try {
      if (!this.transport.available()) {
        this.setState('offline', 'Sync folder is not reachable');
        return;
      }
      this.setState('syncing', null);
      await this.exportOps();
      await this.importOps();
      await this.transport.announce(this.store.deviceId, this.userName);
      this.lastSyncAt = new Date().toISOString();
      this.setState('idle', null);
    } catch (err) {
      this.setState('error', err instanceof Error ? err.message : String(err));
    } finally {
      this.running = false;
      release();
    }
  }

  private async exportOps(): Promise<void> {
    if (!this.transport) return;
    const lastExported = Number(getMeta(this.store.db, 'last_exported_seq') ?? '0');
    const pending = this.store.opsSince(lastExported, true);
    if (pending.length === 0) return;
    const maxSeq = pending[pending.length - 1].seq;
    const batchName = String(maxSeq).padStart(12, '0') + '.jsonl';
    await this.transport.publishOps(
      this.store.deviceId,
      batchName,
      pending.map((p) => p.op),
    );
    setMeta(this.store.db, 'last_exported_seq', String(maxSeq));
  }

  private async importOps(): Promise<void> {
    if (!this.transport) return;
    const peers = this.store.db
      .prepare('SELECT device_id, last_file FROM sync_peers')
      .all() as { device_id: string; last_file: string | null }[];
    const afterByDevice = new Map<string, string | null>(peers.map((p) => [p.device_id, p.last_file]));

    const batches = await this.transport.listPeerBatches(this.store.deviceId, afterByDevice);
    for (const b of batches) {
      let ops;
      try {
        ops = await this.transport.fetchBatch(b.deviceId, b.fileName);
      } catch {
        // Partially synced or unreadable file — leave cursor alone, retry next cycle.
        continue;
      }
      this.store.applyRemoteOps(ops);
      this.store.db
        .prepare(
          `INSERT INTO sync_peers(device_id, last_file, last_seen_at) VALUES(?,?,?)
           ON CONFLICT(device_id) DO UPDATE SET last_file=excluded.last_file, last_seen_at=excluded.last_seen_at`,
        )
        .run(b.deviceId, b.fileName, new Date().toISOString());
    }

    // Refresh peer display names from announcements.
    for (const p of await this.transport.listPeers()) {
      if (p.deviceId === this.store.deviceId) continue;
      this.store.db
        .prepare(
          `INSERT INTO sync_peers(device_id, user_name, last_seen_at) VALUES(?,?,?)
           ON CONFLICT(device_id) DO UPDATE SET user_name=COALESCE(excluded.user_name, sync_peers.user_name),
             last_seen_at=COALESCE(excluded.last_seen_at, sync_peers.last_seen_at)`,
        )
        .run(p.deviceId, p.userName, p.lastSeenAt);
    }
  }

  private setState(state: SyncStatusState, error: string | null): void {
    this.state = state;
    this.lastError = error;
    this.emitStatus();
  }

  private emitStatus(): void {
    this.onStatus(this.status());
  }

  status(): SyncStatus {
    const lastExported = Number(getMeta(this.store.db, 'last_exported_seq') ?? '0');
    const pendingRow = this.store.db
      .prepare('SELECT COUNT(*) AS c FROM oplog WHERE seq > ? AND device_id = ?')
      .get(lastExported, this.store.deviceId) as { c: number };
    const conflictRow = this.store.db
      .prepare('SELECT COUNT(*) AS c FROM sync_conflicts WHERE resolved_at IS NULL')
      .get() as { c: number };
    const peers = this.store.db
      .prepare('SELECT device_id AS deviceId, user_name AS userName, last_seen_at AS lastSeenAt FROM sync_peers')
      .all() as SyncStatus['peers'];
    return {
      state: this.state,
      folder: this.transport ? this.transport.location() : null,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
      pendingOps: pendingRow.c,
      openConflicts: conflictRow.c,
      peers,
    };
  }

  /** Stops timers and waits for any in-flight cycle — safe to close the DB afterwards. */
  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    if (this.exportTimer) clearTimeout(this.exportTimer);
    this.timer = null;
    this.exportTimer = null;
    await this.current;
  }
}
