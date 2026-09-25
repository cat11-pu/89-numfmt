// app.js：渲染结果。返回结构固定为六个键：
// texts、rounded、restored、drift、ok、idempotent。
import { render as formatRender } from "./format.js";
import { check } from "./roundtrip.js";

// 幂等性：格式化输出若已是规范形（普通十进制、小数位不超过精度、
// 末尾无多余的零），再格式化一次必然得到同样的文本。这里只对输出做
// 线性的形态校验，不重复格式化，守住单次线性预算。
function isCanonical(text, precision) {
  const match = /^-?(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) return false;
  const fraction = match[2] || "";
  if (fraction.length > precision) return false;
  return !fraction.endsWith("0");
}

export function render(spec) {
  const values = spec.values || [];
  const precision = spec.precision;
  const formatted = formatRender(values, precision);
  const back = check(values, formatted.texts);
  let idempotent = true;
  for (let i = 0; i < formatted.texts.length; i += 1) {
    if (!isCanonical(formatted.texts[i], precision)) {
      idempotent = false;
      break;
    }
  }
  return { texts: formatted.texts, rounded: formatted.rounded, restored: back.restored,
           drift: back.drift, ok: back.ok, idempotent: idempotent };
}
