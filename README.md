# Mini Blockchain + Live Block Explorer

Day 1 of building in public (SK1X, `sk1x_dev`).

A blockchain from scratch in plain Node.js, zero dependencies: blocks, SHA-256 hashing, proof of work, chain validation, and a web page that shows blocks being mined live.

## Run it

```
npm test     # core tests
npm start    # explorer at http://localhost:3000
```

Needs Node 18+.

## How it works

- `blockchain.js`: `Block` and `Blockchain`. Each block's hash covers its index, timestamp, data, the previous block's hash and a nonce. Mining means incrementing the nonce until the hash starts with N zeros (the difficulty).
- `server.js`: tiny HTTP server. Mining happens server-side; the browser is notified live through Server-Sent Events.
- `public/index.html`: the explorer. Mine blocks, change difficulty, and hit **Tamper** on any block to watch the chain break.

## Next

- Day 2: benchmark mining speed
- Then: optimize it
