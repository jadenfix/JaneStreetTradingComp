import { test } from "node:test";
import assert from "node:assert/strict";
import {
  create,
  place,
  cancel,
  match,
  step,
  equity,
  replay,
} from "../engine.js";
test("price/time priority and partial fills", () => {
  let s = create();
  place(s, "buy", 9900, 3);
  place(s, "buy", 9950, 4);
  place(s, "buy", 9950, 4);
  match(s, "buy", 6, 9900);
  assert.deepEqual(
    s.fills.map((f) => f.quantity),
    [4, 2],
  );
  assert.equal(s.orders.find((o) => o.id === 3).quantity, 2);
  assert.equal(s.inventory, 6);
  assert.equal(s.cash, s.initialCash - 6 * 9950);
});
test("worst case inventory risk and self-cross protection", () => {
  let s = create();
  place(s, "buy", 9900, 20);
  assert.throws(() => place(s, "buy", 9800, 1));
  assert.throws(() => place(s, "sell", 9800, 1));
});
test("sell cash and marked equity conserve value at fill price", () => {
  let s = create();
  place(s, "sell", 10000, 5);
  match(s, "sell", 3, 10000);
  assert.equal(s.inventory, -3);
  assert.equal(s.cash, s.initialCash + 30000);
  assert.equal(equity(s), s.initialCash);
});
test("cancel single or all", () => {
  let s = create();
  place(s, "buy", 9900, 2);
  place(s, "sell", 10100, 2);
  cancel(s, 1);
  assert.equal(s.orders.length, 1);
  cancel(s);
  assert.equal(s.orders.length, 0);
});
test("seed and replay reproducible", () => {
  let s = create();
  place(s, "buy", 9950, 10);
  place(s, "sell", 10050, 10);
  for (let i = 0; i < 100; i++) step(s);
  assert.deepEqual(replay(s.config, s.actions), s);
  assert.ok(Math.abs(s.inventory) <= s.config.limit);
});
test("invalid configuration and orders rejected", () => {
  assert.throws(() => create({ seed: 0, limit: 20, volatility: 30 }));
  let s = create();
  assert.throws(() => place(s, "buy", NaN, 1));
  assert.throws(() => place(s, "buy", 100, 1.5));
});
