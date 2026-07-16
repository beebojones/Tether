#!/usr/bin/env node
// tether-mcp — a tiny, dependency-free MCP stdio server that bridges an MCP client
// (Claude Code / Claude Desktop) to Tether's loopback read API. It holds NO database
// access: every tool just calls http://127.0.0.1:<port> with the bearer token, so the
// running Tether app stays the single writer and the op-log/sync invariants hold.
//
// Env:
//   TETHER_URL    default http://127.0.0.1:8787
//   TETHER_TOKEN  required — contents of <userData>/local-api-token.txt
//
// Protocol: newline-delimited JSON-RPC 2.0 over stdio (MCP stdio transport).

import readline from 'node:readline';

const BASE = (process.env.TETHER_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const TOKEN = process.env.TETHER_TOKEN || '';
const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  { name: 'tether_search', description: 'Full-text search Tether work items. Args: {text, limit?}',
    method: 'POST', path: () => '/items/search',
    inputSchema: { type: 'object', properties: { text: { type: 'string' }, limit: { type: 'number' } }, required: ['text'] },
    body: (a) => ({ text: a.text, limit: a.limit ?? 30 }) },
  { name: 'tether_list_items', description: 'List work items. Args: {filter?, sort?, limit?, offset?}',
    method: 'POST', path: () => '/items/list',
    inputSchema: { type: 'object', properties: { filter: { type: 'object' }, sort: { type: 'object' }, limit: { type: 'number' }, offset: { type: 'number' } } },
    body: (a) => ({ filter: a.filter ?? {}, sort: a.sort, limit: a.limit ?? 200, offset: a.offset ?? 0 }) },
  { name: 'tether_get_item', description: 'Get one work item by id or ident (e.g. "TSK-12"). Args: {id}',
    method: 'GET', path: (a) => `/items/${encodeURIComponent(a.id)}`,
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'tether_item_links', description: 'Links for an item. Args: {id}',
    method: 'GET', path: (a) => `/items/${encodeURIComponent(a.id)}/links`,
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'tether_item_comments', description: 'Comments for an item. Args: {id}',
    method: 'GET', path: (a) => `/items/${encodeURIComponent(a.id)}/comments`,
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'tether_item_activity', description: 'Activity/history for an item. Args: {id}',
    method: 'GET', path: (a) => `/items/${encodeURIComponent(a.id)}/activity`,
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
  { name: 'tether_list_milestones', description: 'List milestones.', method: 'GET', path: () => '/milestones',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'tether_list_releases', description: 'List releases.', method: 'GET', path: () => '/releases',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'tether_list_users', description: 'List users.', method: 'GET', path: () => '/users',
    inputSchema: { type: 'object', properties: {} } },

  // ---- write tools (only work when Tether has writes enabled; else API returns 403) ----
  { name: 'tether_create_item', description: 'Create a work item (requires writes enabled). Args: {type, title, status?, priority?, description?, assigneeId?}',
    method: 'POST', path: () => '/items',
    inputSchema: { type: 'object', properties: { type: { type: 'string' }, title: { type: 'string' }, status: { type: 'string' }, priority: { type: 'string' }, description: { type: 'string' }, assigneeId: { type: 'string' } }, required: ['type', 'title'] },
    body: (a) => a },
  { name: 'tether_update_item', description: 'Update fields on an item (writes). Args: {id, ...fields}',
    method: 'PATCH', path: (a) => `/items/${encodeURIComponent(a.id)}`,
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, status: { type: 'string' }, priority: { type: 'string' }, description: { type: 'string' }, assigneeId: { type: 'string' } }, required: ['id'] },
    body: (a) => { const { id, ...rest } = a; return rest; } },
  { name: 'tether_archive_item', description: 'Archive or unarchive an item (writes). Args: {id, archived?}',
    method: 'POST', path: (a) => `/items/${encodeURIComponent(a.id)}/archive`,
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, archived: { type: 'boolean' } }, required: ['id'] },
    body: (a) => ({ archived: a.archived !== false }) },
  { name: 'tether_add_comment', description: 'Add a comment to an item (writes). Args: {id, body, bodyText?}',
    method: 'POST', path: (a) => `/items/${encodeURIComponent(a.id)}/comments`,
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, body: { type: 'string' }, bodyText: { type: 'string' } }, required: ['id', 'body'] },
    body: (a) => ({ body: a.body, bodyText: a.bodyText ?? a.body }) },
];

async function callApi(tool, args) {
  const opts = { method: tool.method, headers: { authorization: `Bearer ${TOKEN}` } };
  if (tool.method === 'POST' || tool.method === 'PATCH') {
    opts.headers['content-type'] = 'application/json';
    opts.body = JSON.stringify(tool.body ? tool.body(args) : {});
  }
  const res = await fetch(BASE + tool.path(args), opts);
  const text = await res.text();
  if (!res.ok) throw new Error(`Tether API ${res.status}: ${text}`);
  return text; // already JSON text; hand back verbatim
}

function write(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}
function result(id, r) { write({ jsonrpc: '2.0', id, result: r }); }
function error(id, code, message) { write({ jsonrpc: '2.0', id, error: { code, message } }); }

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') {
    return result(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: {} },
      serverInfo: { name: 'tether-mcp', version: '0.1.0' },
    });
  }
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return; // no reply
  if (method === 'ping') return result(id, {});
  if (method === 'tools/list') {
    return result(id, { tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) });
  }
  if (method === 'tools/call') {
    const tool = TOOLS.find((t) => t.name === params?.name);
    if (!tool) return error(id, -32602, `Unknown tool: ${params?.name}`);
    if (!TOKEN) return error(id, -32603, 'TETHER_TOKEN is not set');
    try {
      const text = await callApi(tool, params.arguments || {});
      return result(id, { content: [{ type: 'text', text }] });
    } catch (err) {
      return result(id, { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true });
    }
  }
  if (id !== undefined) return error(id, -32601, `Method not found: ${method}`);
}

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  const s = line.trim();
  if (!s) return;
  let msg;
  try { msg = JSON.parse(s); } catch { return; }
  Promise.resolve(handle(msg)).catch((err) => {
    if (msg && msg.id !== undefined) error(msg.id, -32603, err.message);
  });
});
