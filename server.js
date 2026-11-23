const http = require('http');
const fs = require('fs');
const path = require('path');
const { Blockchain } = require('./blockchain');

const PORT = process.env.PORT || 3000;
let difficulty = 4;
const bc = new Blockchain(difficulty);

const clients = new Set();
const send = (event, payload) => {
  const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of clients) res.write(msg);
};

const state = () => ({ difficulty: bc.difficulty, chain: bc.chain, validation: bc.validate() });

let mining = false;
async function mineOne(data) {
  if (mining) return null;
  mining = true;
  send('mining', { index: bc.chain.length });
  // Yield so the "mining" event actually reaches the browser before we block the loop.
  await new Promise((r) => setTimeout(r, 50));
  const block = bc.addBlock(data);
  mining = false;
  send('block', { block, validation: bc.validate() });
  return block;
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); }
    });
  });
}

const json = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'public', 'index.html')));
  }

  if (req.method === 'GET' && req.url === '/api/chain') return json(res, 200, state());

  if (req.method === 'GET' && req.url === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  if (req.method === 'POST' && req.url === '/api/mine') {
    const body = await readBody(req);
    const data = body.data ?? `block #${bc.chain.length}`;
    const block = await mineOne(data);
    return block ? json(res, 200, block) : json(res, 409, { error: 'already mining' });
  }

  // Demo: tamper with a block to show validation breaking.
  if (req.method === 'POST' && req.url === '/api/tamper') {
    const body = await readBody(req);
    const i = Number(body.index);
    if (!Number.isInteger(i) || i < 1 || i >= bc.chain.length) return json(res, 400, { error: 'bad index' });
    bc.chain[i].data = 'TAMPERED';
    send('state', state());
    return json(res, 200, bc.validate());
  }

  if (req.method === 'POST' && req.url === '/api/reset') {
    const body = await readBody(req);
    const d = Number(body.difficulty);
    if (Number.isInteger(d) && d >= 1 && d <= 6) difficulty = d;
    bc.difficulty = difficulty;
    bc.chain = [bc.createGenesis()];
    send('state', state());
    return json(res, 200, state());
  }

  json(res, 404, { error: 'not found' });
});

server.listen(PORT, () => console.log(`Explorer running at http://localhost:${PORT}`));
