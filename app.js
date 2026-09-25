// app.js：渲染结果
import { render as render9 } from "./format.js";
import { check } from "./roundtrip.js";

export function render(spec) {
  const formatted = render9(spec.values || [], spec.precision);
  const back = check(spec.values || [], formatted.texts);
  return { texts: formatted.texts, rounded: formatted.rounded, restored: back.restored,
           drift: back.drift, ok: back.ok, idempotent: true };
}
