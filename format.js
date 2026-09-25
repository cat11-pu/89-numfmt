// format.js：格式化（基线：直接转字符串）
export function render(values, precision) {
  return { texts: values.map((value) => String(value)), rounded: 0 };
}
