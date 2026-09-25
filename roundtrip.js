// roundtrip.js：把格式化文本解析回数值，并与原值逐项比较。
// 有偏差的位置记入 drift；drift 为空则 ok 为 true（往返保真）。
// NaN 与 NaN 视为一致（=== 对 NaN 不成立，单独判断）。

export function check(values, texts) {
  const restored = new Array(texts.length);
  const drift = [];
  for (let i = 0; i < texts.length; i += 1) {
    const num = Number(texts[i]);
    restored[i] = num;
    const original = values[i];
    const same = num === original || (Number.isNaN(num) && Number.isNaN(original));
    if (!same) drift.push(i);
  }
  return { restored, drift, ok: drift.length === 0 };
}
