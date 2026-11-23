const assert = require('assert');
const { Blockchain } = require('./blockchain');

const bc = new Blockchain(3);
bc.addBlock({ from: 'a', to: 'b', amount: 5 });
bc.addBlock({ from: 'b', to: 'c', amount: 2 });

assert.strictEqual(bc.chain.length, 3);
assert.ok(bc.chain.every((b) => b.hash.startsWith('000')), 'all blocks meet difficulty');
assert.deepStrictEqual(bc.validate(), { valid: true });

// Tamper with data: validation must catch it.
bc.chain[1].data.amount = 5000;
let r = bc.validate();
assert.strictEqual(r.valid, false);
assert.strictEqual(r.index, 1);

// Tamper and re-hash (without redoing proof of work): still caught.
bc.chain[1].hash = bc.chain[1].computeHash();
r = bc.validate();
assert.strictEqual(r.valid, false);

console.log('all tests passed');
