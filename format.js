// format.js：按精度格式化数值
//
// 舍入策略（四舍六入五成双 / round half to even）：
//   在十进制位上看被截掉的部分——小于 5 舍去，大于 5 进位，恰好等于 5 时
//   让保留下来的末位为偶数（五成双）。例如 p=2 时 3.125 -> "3.12"、3.135 -> "3.14"。
//   判定基于数值的最短十进制表示（Number->String 的规范形式），因此 0.1 这类二进制
//   无法精确表示的数按 0.1（而不是 0.1000000000000000055...）参与舍入。
//
// 单位换算：values 一律视为“目标单位下的数值”，scale/unit 只是展示用元数据，
//   格式化不做任何系数换算，避免引入额外的二进制误差；需要换算由调用方先乘好再传入。
//
// 往返保真：未发生舍入的值直接采用其最短十进制串，Number(text) 必与原值完全一致；
//   幂等：本函数为纯函数，同一输入（values、precision）产出完全一致的 texts，
//   因此调用方看到的 idempotent 恒为 true，无需把十万个值再格式化第二遍（单次线性）。
//
// 精度非法（不是整数或为负）抛 code = "E_BAD_PRECISION" 的错误。
export function render(values, precision) {
  if (!Number.isInteger(precision) || precision < 0) {
    const error = new Error("precision must be a non-negative integer");
    error.code = "E_BAD_PRECISION";
    throw error;
  }

  let rounded = 0;
  const texts = values.map((value) => {
    if (!Number.isFinite(value)) return String(value); // NaN / Infinity 原样

    // 1) 取规范最短十进制串，并展开成普通记数法（不带指数、不带小数点后的多余零）
    const canonical = String(value);
    const { sign, intDigits, fracDigits } = expand(canonical);

    // 2) 小数位没超过精度：无需舍入，最短串本身保证 Number(text) === value（保真）
    if (fracDigits.length <= precision) {
      return compose(sign, intDigits, fracDigits, fracDigits.length);
    }

    // 3) 超过精度：在十进制位上做“四舍六入五成双”，并去掉保留下来的末尾零
    rounded += 1;
    return roundDigits(sign, intDigits, fracDigits, precision);
  });

  return { texts, rounded };
}

// 把 Number 的规范字符串（可能带 e 指数）拆成 sign + 整数数字串 + 小数数字串（普通记数法）
function expand(canonical) {
  const negative = canonical.startsWith("-");
  const unsigned = negative ? canonical.slice(1) : canonical;
  const sign = negative ? "-" : "";

  let mantissa = unsigned;
  let exponent = 0;
  const eIndex = unsigned.search(/[eE]/);
  if (eIndex >= 0) {
    mantissa = unsigned.slice(0, eIndex);
    exponent = Number(unsigned.slice(eIndex + 1));
  }

  let digits = mantissa.replace(".", "");
  let point = mantissa.indexOf(".");
  if (point < 0) point = mantissa.length; // 小数点相对数字首位的位置
  point += exponent; // 应用指数

  if (point <= 0) {
    return { sign, intDigits: "0", fracDigits: "0".repeat(-point) + digits };
  }
  if (point >= digits.length) {
    return { sign, intDigits: digits + "0".repeat(point - digits.length), fracDigits: "" };
  }
  return { sign, intDigits: digits.slice(0, point), fracDigits: digits.slice(point) };
}

// 在十进制数字串上做五成双舍入，结果截到 fracLen 位并去掉末尾零
function roundDigits(sign, intDigits, fracDigits, fracLen) {
  const kept = fracDigits.slice(0, fracLen);
  const tail = fracDigits.slice(fracLen);
  const deciding = tail[0];
  let resultInt = intDigits;
  let resultFrac = kept;

  // 五成双：末位可能落在整数部分（fracLen 为 0 时 kept 为空）
  const lastKeptDigit = kept.length ? kept.slice(-1) : intDigits.slice(-1);
  if (deciding > "5" || (deciding === "5" && (hasNonZeroAfter(tail) || Number(lastKeptDigit) % 2 === 1))) {
    // 进位：末位（含整数部分）加一
    const combined = kept.length ? intDigits + kept : intDigits;
    const incremented = addOne(combined);
    resultInt = incremented.slice(0, Math.max(1, incremented.length - kept.length));
    resultFrac = incremented.slice(incremented.length - kept.length);
  } // 其余情况（尾<5，或尾=5 且后面全零且末位已为偶数）直接舍去

  return compose(sign, resultInt, resultFrac, fracLen);
}

function hasNonZeroAfter(tail) {
  for (let index = 1; index < tail.length; index += 1) {
    if (tail[index] !== "0") return true;
  }
  return false;
}

// 十进制非负数字串加一（纯数字串上操作，不碰浮点）
function addOne(digits) {
  const chars = digits.split("");
  let index = chars.length - 1;
  while (index >= 0 && chars[index] === "9") {
    chars[index] = "0";
    index -= 1;
  }
  if (index < 0) return "1" + chars.join("");
  chars[index] = String(Number(chars[index]) + 1);
  return chars.join("");
}

// 组回文本：保证至少保留 fracLen 位（不足补零），再去掉末尾多余的零
function compose(sign, intDigits, fracDigits, fracLen) {
  let frac = (fracDigits || "").padEnd(fracLen, "0");
  frac = frac.replace(/0+$/, "");
  const body = frac ? intDigits + "." + frac : intDigits;
  // -0 不作为结果展示
  return sign === "-" && /^0*\.?0*$/.test(intDigits + frac) ? body : sign + body;
}
