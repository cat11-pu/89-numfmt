// format.js：按精度做十进制舍入并去掉多余的零。
//
// 舍入策略：round-half-to-even（银行家舍入）。先取数值的最短可往返十进制
// 表示（toExponential），在第 precision 位小数处舍入；恰好在半程（前一位是 5
// 且后面全为零）时向偶数靠。这样 3.125 在精度 2 下得到 3.12。
// 非有限值（NaN、±Infinity）不做舍入，直接转字符串。

export class FormatError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "FormatError";
    this.code = code;
  }
}

export function assertPrecision(precision) {
  if (typeof precision !== "number" || !Number.isInteger(precision) || precision < 0) {
    throw new FormatError("E_BAD_PRECISION", "precision must be a non-negative integer");
  }
}

// 数字字符串加一（"09" -> "10"，"" -> "1"），用于舍入进位。
function bump(digits) {
  const out = digits.split("");
  let i = out.length - 1;
  while (i >= 0 && out[i] === "9") {
    out[i] = "0";
    i -= 1;
  }
  if (i < 0) {
    out.unshift("1");
  } else {
    out[i] = String(Number(out[i]) + 1);
  }
  return out.join("");
}

// 被舍弃的数位是否触发进位（half-to-even）。
function shouldRoundUp(discarded, lastKeptDigit) {
  if (discarded.length === 0) return false;
  if (discarded[0] !== "5") return discarded[0] > "5";
  if (/[1-9]/.test(discarded.slice(1))) return true;
  return lastKeptDigit !== "" && Number(lastKeptDigit) % 2 === 1;
}

// 把 有效数字 kept × 10^shift 写成普通十进制文本，并去掉多余的零。
function toText(kept, shift, negative) {
  if (kept === "" || /^0+$/.test(kept)) return "0";
  let text;
  if (shift >= 0) {
    text = kept + "0".repeat(shift);
  } else {
    const fracLength = -shift;
    if (kept.length > fracLength) {
      text = kept.slice(0, kept.length - fracLength) + "." + kept.slice(kept.length - fracLength);
    } else {
      text = "0." + "0".repeat(fracLength - kept.length) + kept;
    }
    text = text.replace(/0+$/, "").replace(/\.$/, "");
  }
  return negative ? "-" + text : text;
}

export function formatValue(value, precision) {
  if (!Number.isFinite(value)) return String(value);
  const negative = value < 0;
  const [mantissa, expText] = Math.abs(value).toExponential().split("e");
  const exponent = Number(expText);
  const digits = mantissa.replace(".", "");
  // 第 i 个数位的位值是 10^(exponent - i)，保留到 10^(-precision) 位。
  // rawKeep < 0 表示整个数值不足半个舍入单位，直接归零。
  const rawKeep = exponent + precision + 1;
  if (rawKeep < 0) return "0";
  const keep = Math.min(rawKeep, digits.length);
  const kept = digits.slice(0, keep);
  const discarded = digits.slice(keep);
  let rounded = kept;
  if (shouldRoundUp(discarded, keep === 0 ? "" : kept[keep - 1])) {
    rounded = bump(kept);
  }
  const shift = exponent - keep + 1;
  return toText(rounded, shift, negative);
}

export function render(values, precision) {
  assertPrecision(precision);
  const texts = new Array(values.length);
  let rounded = 0;
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    const text = formatValue(value, precision);
    texts[i] = text;
    if (Number.isFinite(value) && Number(text) !== value) rounded += 1;
  }
  return { texts, rounded };
}
