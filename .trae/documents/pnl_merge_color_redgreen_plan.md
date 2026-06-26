# UI优化计划：持仓盈亏合并 + 全局涨跌颜色反转

## 代码库研究结论

### 当前状态分析

**1. 资产明细页盈亏字段布局**
- 今日盈亏 (`#detailTodayPnL`)：`+¥1,400 (+0.74%)` 格式——金额+括号百分比，一个卡片
- 持仓盈亏 (`#detailPnL`)：`+¥41,600`——仅金额，一个卡片
- 持仓收益率 (`#detailPnLPct`)：`+27.73%`——仅百分比，独立 wide 卡片（用户红框标注处）
- 位于 [index.html](file:///workspace/index.html) 第5366-5391行，detail-cards-grid 布局中

**2. 全局涨跌颜色现状**
- CSS变量（第25-26行）：`--positive: #2E8B57`（绿）, `--negative: #CD5C5C`（红）——中国 convention 绿涨红跌
- 部分硬编码样式已使用红涨绿跌：`.col-today.up`(#d14b4b), `.sub-value.up`(#d14b4b), `.sr-pct.up`(#d14b4b) 为红色up
- 标签背景色仍使用旧 convention：`.tag-up` 绿底(rgba(46,139,87,0.08))、`.tag-down` 红底(rgba(205,92,92,0.08))
- K线图末端标签（第6738行）：通过JS使用 `var(--positive/negative)`，变量交换后自动生效
- 头部总资产盈亏（第307行）：`.summary-col .value.small { color: var(--positive) }`，变量交换后自动生效
- 看多/看空标签：`.ratio-bull`(--positive), `.ratio-bear`(--negative)，变量交换后自动生效
- 买入/卖出颜色：`.txn-page-amount.buy/sell` 使用 --positive/--negative，变量交换后自动正确（买入=红=看多，卖出=绿=看空）

## 需要修改的文件

仅需修改 **`/workspace/index.html`**（单文件PWA应用）

## 修改步骤

### Step 1: 交换CSS变量颜色值（红涨绿跌）
- 位置：第25-26行 `:root` 变量
- `--positive` 从 `#2E8B57` 改为 `#c0392b`（专业红色，与品牌色 #A44A3F 协调）
- `--negative` 从 `#CD5C5C` 改为 `#27ae60`（专业绿色）
- 统一硬编码颜色值 `.col-today.up`、`.sub-value.up`、`.sr-pct.up` 的 `#d14b4b` 为 `#c0392b`
- 统一硬编码颜色值 `.col-today.down`、`.sub-value.down`、`.sr-pct.dn` 的 `#2e8b57` 为 `#27ae60`

### Step 2: 更新标签背景色（tag-up/tag-down, history-mini-tag）
- `.tag-up` 背景从 `rgba(46,139,87,0.08)` 改为 `rgba(192,57,43,0.08)`（红底）
- `.tag-down` 背景从 `rgba(205,92,92,0.08)` 改为 `rgba(39,174,96,0.08)`（绿底）
- `.history-mini-tag.up` 背景/颜色同步更新
- `.history-mini-tag.down` 背景/颜色同步更新

### Step 3: 合并持仓盈亏与持仓收益率（竖杆分隔符）
- HTML修改：删除第5388-5391行独立的"持仓收益率"detail-card
- 修改持仓盈亏卡片：为 `#detailPnL` 添加足够空间显示合并内容
- JS修改（fillAssetDetail函数，约第7413行）：
  - 将 `detailPnL.textContent` 从仅金额改为 `+¥41,600.00 | +27.73%` 格式
  - 金额与百分比之间用 ` | ` 竖杆分隔
  - 删除对 `detailPnLPct` 的引用（该元素将不存在）
- 今日盈亏格式同步修改：将括号改为竖杆，从 `+¥1,400 (+0.74%)` 改为 `+¥1,400 | +0.74%`（第7407行附近）

### Step 4: 更新资产列表项中持仓盈亏的括号为竖杆
- 持仓列表中第二行的"持仓盈亏"列（`.sub-value`），格式从 `+¥41,600 (+27.73%)` 改为 `+¥41,600 | +27.73%`
- JS渲染函数中更新格式（搜索渲染sub-value的代码）
- 同时移除第三行（asset-row-extra）中冗余的"持仓收益率"文字（因为已合并到第二行）

### Step 5: 验证其他颜色使用点
检查并确保所有颜色引用正确：
- K线图末端收益率标签（JS中 isUp ? positive : negative）
- 头部今日盈亏文字颜色（需动态设置：涨红跌绿，不能固定positive）
- 资产明细页其他profit/loss颜色（.detail-value.profit/loss, .today-up/today-down）
- 笔记预测看多/看空颜色
- 交易记录买入/卖出颜色

### Step 6: 浏览器验证
- 启动本地服务器，在浏览器中验证：
  - 首页头部盈亏颜色（涨红跌绿）
  - K线图末端标签颜色
  - 持仓列表今日盈亏/持仓盈亏颜色和格式
  - 资产明细页今日盈亏/持仓盈亏格式（竖杆分隔）和颜色
  - 笔记预测看多/看空颜色
  - 交易记录买入/卖出颜色
- 验证无控制台错误

### Step 7: 推送到main分支
- `git add .`
- `git commit -m "feat: 持仓盈亏合并收益率+竖杆分隔, 全局红涨绿跌颜色"`
- `git push origin main`

## 潜在风险与注意事项

1. **删除detailPnLPct元素后JS报错**：需确保所有对 `detailPnLPct` 的JS引用都被移除或更新
2. **硬编码颜色不一致**：需全面搜索所有硬编码色值，统一替换
3. **竖杆分隔符视觉效果**：使用 ` | ` （空格+竖杆+空格）确保可读性
4. **K线图渐变填充色**：K线面积渐变使用的是 `rgba(164,74,63,...)` 品牌色，这不是涨跌色，不需修改
5. **头部盈亏动态颜色**：当前头部 todayPnL 的颜色固定为 `var(--positive)`，需要改为根据涨跌动态切换（当前demo数据都是涨所以看不出来）
