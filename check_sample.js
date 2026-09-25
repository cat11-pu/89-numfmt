import fs from "node:fs";
import { render as render9 } from "./format.js";
import { check } from "./roundtrip.js";
import { render } from "./app.js";

// 验收断言：上面每条值收进 emit，最后与期望值逐项比对，不符就非零退出。
const __lines = [];
function emit(label, value) { __lines.push([String(label).replace(/ =$/, ""), value]); }


const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/numbers.json", "utf8"));
const formatted = render9(spec.values || [], spec.precision);
const back = check(spec.values || [], formatted.texts);
const view = render(spec);

emit("格式化结果 =", JSON.stringify(formatted.texts));
emit("发生舍入的个数 =", formatted.rounded);
emit("还原后的数值 =", JSON.stringify(back.restored));
emit("产生偏差的位置 =", JSON.stringify(back.drift));
emit("往返是否保真 =", back.ok);
emit("精度 =", spec.precision);


// ---- 异常路径探针：真调用实现，看它报出什么码（不是从样例里抄）----
try {
  const bad = render9([1.5], -1);
  emit("精度非法的错误码", bad.texts.length ? (bad.code || "no-code") : "no-error");
} catch (error) {
  emit("精度非法的错误码", error.code || error.message);
}


// ---- 期望值（参考模型算出，与题面给的验收数值一致）----
const EXPECTED = {
  "格式化结果": [
    "1.25",
    "2.5",
    "3.12",
    "10"
  ],
  "发生舍入的个数": 1,
  "还原后的数值": [
    1.25,
    2.5,
    3.12,
    10.0
  ],
  "产生偏差的位置": [
    2
  ],
  "往返是否保真": false,
  "精度": 2
};
// 有的值在收进来之前已经 stringify 过，比较前先试着解析回来，避免类型错配把正确实现判成不过。
function __same(got, want) {
  if (typeof got === "string") {
    try { const parsed = JSON.parse(got); if (JSON.stringify(parsed) === JSON.stringify(want)) return true; } catch (error) { /* 不是 JSON 就按原文比 */ }
  }
  return JSON.stringify(got) === JSON.stringify(want);
}
let __bad = 0;
for (const [label, want] of Object.entries(EXPECTED)) {
  const found = __lines.find((pair) => pair[0] === label);
  if (!found) { __bad += 1; console.log("缺失验收项 " + label); continue; }
  const got = found[1];
  if (__same(got, want)) { console.log("一致 " + label + " = " + JSON.stringify(got)); }
  else { __bad += 1; console.log("不一致 " + label + " 期望 " + JSON.stringify(want) + " 实际 " + JSON.stringify(got)); }
}
console.log("验收项 " + (Object.keys(EXPECTED).length - __bad) + "/" + Object.keys(EXPECTED).length + " 通过");
process.exit(__bad === 0 ? 0 : 1);
