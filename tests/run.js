import assert from "node:assert";
import { render as render9 } from "../format.js";
import { check } from "../roundtrip.js";
import { render } from "../app.js";

let failed = 0;
function check2(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const values = [1.25, 2.5];

check2("format returns texts", () => {
  assert.ok(Array.isArray(render9(values, 2).texts));
});

check2("format reports rounded count", () => {
  assert.strictEqual(typeof render9(values, 2).rounded, "number");
});

check2("check returns restored", () => {
  assert.ok(Array.isArray(check(values, ["1.25", "2.5"]).restored));
});

check2("check reports drift", () => {
  assert.ok(Array.isArray(check(values, ["1.25", "2.5"]).drift));
});

check2("render exposes ok flag", () => {
  assert.strictEqual(typeof render({ values: values, precision: 2, scale: 1 }).ok, "boolean");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
