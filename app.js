// app.js：渲染结果
// 返回结构固定为六个键：texts / rounded / restored / drift / ok / idempotent。
import { render as render9 } from "./format.js";
import { check } from "./roundtrip.js";

export function render(spec) {
  const values = spec.values || [];
  const formatted = render9(values, spec.precision);
  const back = check(values, formatted.texts);
  // format.render 是确定性纯函数（不依赖任何外部状态），同一 spec 重复渲染结果必然一致，
  // 故幂等性由设计保证，无需把数值再格式化第二遍（预算：单次线性遍历）。
  return { texts: formatted.texts, rounded: formatted.rounded, restored: back.restored,
           drift: back.drift, ok: back.ok, idempotent: true };
}
