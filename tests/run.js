import assert from "node:assert";
import { render as render9 } from "../format.js";
import { check } from "../roundtrip.js";
import { render } from "../app.js";

let failed = 0;
function check2(name, fn) {
  try { fn(); console.log("ok " + name); }
  catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
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

// ---- 功能迭代新增断言 ----
check2("round half to even and trim zeros", () => {
  const result = render9([1.25, 2.5, 3.125, 10], 2);
  assert.deepStrictEqual(result.texts, ["1.25", "2.5", "3.12", "10"]);
  assert.strictEqual(result.rounded, 1);
});

check2("half-to-even tie goes to even last digit", () => {
  // 3.125/3.135 恰在 5 上：末位取偶（2 与 4）；>5 进位、<5 舍去
  assert.deepStrictEqual(render9([3.125, 3.135, 3.124, 3.126], 2).texts,
    ["3.12", "3.14", "3.12", "3.13"]);
  // 精度为 0 时末位在个位（整数部分），五成双同样作用于个位
  assert.deepStrictEqual(render9([2.5, 3.5, -2.5, -3.5, 4.5, 1.5], 0).texts,
    ["2", "4", "-2", "-4", "4", "2"]);
});

check2("rounded counts only items whose digits exceed precision", () => {
  // 2.50->2.5 只是去零不算舍入；3.125 才发生舍入
  assert.strictEqual(render9([1.25, 2.5, 3.125, 10, 0.1], 2).rounded, 1);
  assert.deepStrictEqual(render9([2.5, 10, 0.1], 2).texts, ["2.5", "10", "0.1"]);
});

check2("roundtrip marks drift and ok", () => {
  const result = check([1.25, 2.5, 3.125, 10], ["1.25", "2.5", "3.12", "10"]);
  assert.deepStrictEqual(result.restored, [1.25, 2.5, 3.12, 10]);
  assert.deepStrictEqual(result.drift, [2]);
  assert.strictEqual(result.ok, false);
  const clean = check([1.25, 2.5], ["1.25", "2.5"]);
  assert.deepStrictEqual(clean.drift, []);
  assert.strictEqual(clean.ok, true);
});

check2("fidelity: unrounded items parse back exactly", () => {
  const cases = [0.1, 0.2, 0.3, 1.25, 2.5, 1 / 3, 1e21, 5e-7, -0.0001];
  // 普通记数法下的小数位数（与 format.js 的展开规则同口径，需考虑指数串）
  const fracLength = (value) => {
    let mantissa = String(value).replace(/^-/, "");
    let exponent = 0;
    const at = mantissa.search(/[eE]/);
    if (at >= 0) { exponent = Number(mantissa.slice(at + 1)); mantissa = mantissa.slice(0, at); }
    let point = mantissa.indexOf(".");
    if (point < 0) point = mantissa.length;
    point += exponent;
    const digits = mantissa.replace(".", "");
    if (point <= 0) return -point + digits.length;
    if (point >= digits.length) return 0;
    return digits.length - point;
  };
  for (const precision of [0, 2, 6, 12, 17]) {
    const { texts } = render9(cases, precision);
    cases.forEach((value, index) => {
      if (fracLength(value) <= precision) {
        assert.ok(Object.is(Number(texts[index]), value),
          "fidelity broken for " + value + " p=" + precision);
      }
    });
  }
});

check2("idempotent: same input formats identically", () => {
  const many = Array.from({ length: 2000 }, (_, i) => (i * 1.7) / 3 - 100);
  const first = render9(many, 4).texts;
  const second = render9(many, 4).texts;
  assert.deepStrictEqual(first, second);
  // 还原值再按同精度格式化也稳定
  const again = render9(first.map(Number), 4).texts;
  assert.deepStrictEqual(again, first);
});

check2("bad precision throws E_BAD_PRECISION via real call", () => {
  for (const bad of [-1, -0.5, 2.5, NaN, "2", null, undefined]) {
    assert.throws(() => render9([1.5], bad), (error) => error.code === "E_BAD_PRECISION");
  }
  // 合法边界不抛
  assert.doesNotThrow(() => render9([1.5], 0));
});

check2("app.render keeps the six-key shape", () => {
  const result = render({ values: [1.25, 2.5, 3.125, 10], precision: 2, scale: 1, unit: "ms" });
  assert.deepStrictEqual(Object.keys(result).sort(),
    ["drift", "idempotent", "ok", "restored", "rounded", "texts"]);
  assert.deepStrictEqual(result.texts, ["1.25", "2.5", "3.12", "10"]);
  assert.strictEqual(result.rounded, 1);
  assert.deepStrictEqual(result.drift, [2]);
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.idempotent, true);
});

const total = 13;
console.log(total + " cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
