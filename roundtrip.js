// roundtrip.js：把格式化文本解析回数值，与原值逐项比对
//
// 解析：原生 Number(text)；恢复失败得到 NaN。
// 比较：同值（SameValue，Object.is 语义）即认为无偏差——
//   仅当解析值与原值存在真实差异（含 NaN 这类解析失败）时把位置记入 drift。
// 位置下标从 0 开始；ok 表示全部项都无偏差（drift 为空）。
export function check(values, texts) {
  const restored = texts.map((text) => Number(text));
  const drift = [];
  for (let index = 0; index < values.length; index += 1) {
    if (!sameValue(values[index], restored[index])) drift.push(index);
  }
  return { restored, drift, ok: drift.length === 0 };
}

// SameValue 语义：区分 -0 与 0，两个 NaN 视为相等
function sameValue(a, b) {
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  return Object.is(a, b);
}
