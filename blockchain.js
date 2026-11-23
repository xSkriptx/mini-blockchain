const crypto = require('crypto');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

class Block {
  constructor(index, timestamp, data, previousHash) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.computeHash();
  }

  computeHash() {
    return sha256(
      this.index + this.timestamp + JSON.stringify(this.data) + this.previousHash + this.nonce
    );
  }

  // Proof of work: keep changing the nonce until the hash starts with `difficulty` zeros.
  mine(difficulty) {
    const target = '0'.repeat(difficulty);
    const start = Date.now();
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.computeHash();
    }
    this.miningTimeMs = Date.now() - start;
    return this;
  }
}

class Blockchain {
  constructor(difficulty = 4) {
    this.difficulty = difficulty;
    this.chain = [this.createGenesis()];
  }

  createGenesis() {
    const genesis = new Block(0, 0, 'Genesis block', '0');
    genesis.mine(this.difficulty);
    return genesis;
  }

  get latest() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const block = new Block(this.chain.length, Date.now(), data, this.latest.hash);
    block.mine(this.difficulty);
    this.chain.push(block);
    return block;
  }

  // Returns { valid: true } or { valid: false, index, reason }.
  validate() {
    const target = '0'.repeat(this.difficulty);
    for (let i = 0; i < this.chain.length; i++) {
      const b = this.chain[i];
      if (b.hash !== b.computeHash()) return { valid: false, index: i, reason: 'hash does not match contents' };
      if (!b.hash.startsWith(target)) return { valid: false, index: i, reason: 'proof of work missing' };
      if (i > 0 && b.previousHash !== this.chain[i - 1].hash) {
        return { valid: false, index: i, reason: 'previousHash does not match previous block' };
      }
    }
    return { valid: true };
  }
}

module.exports = { Block, Blockchain, sha256 };
