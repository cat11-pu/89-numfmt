// roundtrip.js：往返（基线：不校验、不记偏差）
export function check(values, texts) {
  return { restored: texts.map((text) => Number(text)), drift: [], ok: true };
}
