# numfmt

浏览器单页工作台（原生 ES 模块，零依赖）。

## 起服务看页面

    python3 -m http.server 8000

浏览器打开 http://127.0.0.1:8000/ ，改样例点运行看结果。

## 测试

    node tests/run.js

## 场景自检

    node check_sample.js

## 数值约定

- 格式化 `format.render(values, precision)`：在十进制位上按**四舍六入五成双**
  （round half to even）把每个值收进 `precision` 位小数，再去掉保留下来的末尾零。
  被截部分小于 5 舍去、大于 5 进位、恰好为 5 时让末位取偶
  （如 p=2 时 `3.125 -> "3.12"`、`3.135 -> "3.14"`）。
  判定基于数值的最短十进制表示，故 `0.1` 按 0.1 而不是其二进制长尾参与舍入。
  发生舍入的项数计入 `rounded`；`precision` 为负或非整数时抛 `code = "E_BAD_PRECISION"`。
- 往返 `roundtrip.check(values, texts)`：用原生 `Number(text)` 解析回来，按 SameValue
  与原值逐项比较，有偏差的下标记入 `drift`，返回 `restored / drift / ok`。
- 保真：未发生舍入的值直接采用最短十进制串，`Number(text) === 原值`，往返无损；
  幂等：格式化是确定性纯函数，同一输入结果相同，对还原值再格式化也稳定。
- 单位换算：`values` 一律视为“目标单位下的数值”，`scale`/`unit` 仅为展示元数据，
  格式化不做系数换算（避免额外二进制误差），需要换算由调用方先乘好再传入。
- 预算：单次线性遍历（十万个数值只格式化一遍）；仅使用标准库与原生浏览器 API。
