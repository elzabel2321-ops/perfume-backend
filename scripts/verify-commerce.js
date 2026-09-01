const assert = require("assert");
const { TRANSITIONS, normalizeStatus } = require("../services/orderStatusService");

assert.strictEqual(normalizeStatus("pending"), "pending_payment");
assert.strictEqual(normalizeStatus("confirmed"), "paid");
assert.ok(TRANSITIONS.paid.includes("processing"));
assert.ok(!TRANSITIONS.delivered.includes("processing"));
assert.ok(!TRANSITIONS.pending_payment.includes("delivered"));
assert.ok(TRANSITIONS.paid.includes("cancelled"));
assert.ok(TRANSITIONS.paid.includes("refunded"));

const mongoose = require("mongoose");
assert.strictEqual(mongoose.Types.ObjectId.isValid("1"), false);
assert.ok(mongoose.Types.ObjectId.isValid("64b8f0c2e1b1a2c3d4e5f678"));

console.log("Commerce rules verified: status machine, ID validation.");
