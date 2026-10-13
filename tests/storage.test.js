import { test } from "node:test";
import assert from "node:assert/strict";
import { save, announce } from "../shared.js";
test("failed persistence remains visible after success announcements", () => {
  const status = { textContent: "" };
  globalThis.document = { getElementById: () => status };
  globalThis.localStorage = {
    setItem() {
      throw Error("Quota exceeded");
    },
  };
  assert.equal(save("test", {}), false);
  announce("Order placed.");
  assert.match(status.textContent, /Storage unavailable/);
  assert.match(status.textContent, /Order placed/);
  globalThis.localStorage = { setItem() {} };
  assert.equal(save("test", {}), true);
  announce("Saved");
  assert.equal(status.textContent, "Saved");
});
