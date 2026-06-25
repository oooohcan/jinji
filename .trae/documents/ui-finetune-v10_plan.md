# UI 微调计划：4 项细节优化

> 提交日期：2026-06-26
> 工作目录：`/workspace`（main 分支，单文件 PWA `index.html`，约 7144 行）
> 目标：保留上轮金融风重设计成果，仅做 4 处微调，**不重写已有结构**

---

## 背景说明

图 1（交易记录半弹框）和图 6（腾讯微证券自选）展示了两种"参考风格"：
- **图 1** 风格：极简白底、无卡片阴影、日期分组、整条行无内边距、tag 放在右侧
- **图 6** 风格：每条记录字段名+值紧贴一行右侧，像 Excel 表格

当前实现：
- 历史笔记 sheet 卡片已经拉满宽度（`margin:0 8px 10px`），但**整体仍有 8px 边距和细线圆角**，与图 1 那种"白底直接顶满"的极简风还有差距
- 持仓列表是**三行布局**（标题行 / 横向 meta 行 / 价格+盈亏行），但参考图 6 要求把字段**依次罗列到行尾（同一行）**，且**最上方增加字段说明行**
- 记资产新增表单内有 "资产分类" `<select>` 下拉框——按需求移除
- 记资产搜索行有彩色 sr-type-dot 方块 + "+ 新增一只股票 / 港美股" 文案——按需求移除方块和"港美股"字样

---

## 需求 1：历史笔记卡片更宽，参考图 1 极简风

**文件**：`/workspace/index.html`
**位置**：[index.html:1684-L1697](file:///workspace/index.html#L1684-L1697)（CSS）+ [index.html:5213-L5247](file:///workspace/index.html#L5213-L5247)（渲染函数 `renderNotesHistory`）

### 现状问题
- `.history-sheet-list .history-item { margin:0 8px 10px; border-radius:12px; border:1px solid var(--border); }` —— 卡片左右还有 8px 边距 + 圆角 + 细线边框
- 与图 1（交易记录）对比：图 1 整片背景纯白，行与行之间**仅一条 1px 分隔线**，无任何边框/圆角/边距

### 改动方案
1. **去掉卡片外边距和边框**
   - `.history-sheet-list .history-item` → `margin:0; border:none; border-radius:0; box-shadow:none;`
2. **改成行间分隔线**（参考 `.txn-page-item` 风格）
   - `::before` 伪元素画 1px 分隔线：`content:''; position:absolute; left:16px; right:16px; top:0; height:1px; background:var(--border);`
   - 第一个卡片不要分隔线：`.history-sheet-list .history-item:first-child::before { display:none; }`
3. **背景纯白**（与 sheet body 同色，不再用 var(--card)），让卡片与背景融为一体
4. **padding 收紧**到 `12px 16px`，与图 1 `.txn-page-item { padding:12px 16px }` 一致
5. **展开内容样式同步去掉边框和圆角**
   - `.history-sheet-list .history-item.expand-open .history-detail { padding:0 16px 14px; }`

### 风险
- 笔记展开后（"半导体"/"消费" 等）有标签和正文，需要保留 tag 样式（不影响）
- 笔记点击行会展开，**展开区背景与卡片同色**，无视觉断裂

---

## 需求 2：去除记资产新增表单的"资产分类"下拉框

**文件**：`/workspace/index.html`
**位置**：[index.html:4694-L4706](file:///workspace/index.html#L4694-L4706)

### 现状问题
- `<select class="input-field" id="recordAddType" onchange="handleAddTypeChange()">` —— 用户进入"新增"表单后还能再改分类，但分类已在 sheet 顶部"选择资产分类"网格里选定过，重复
- 冗余且违反单一数据源原则

### 改动方案
**直接删除该 form-group**（4695-4706 行整段），保留：
```html
<div class="record-form record-flow-panel" id="recordAddForm">
  <!-- 删除：资产分类下拉框 -->
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">名称</label>
      <input ...>
    </div>
    <div class="form-group">
      <label class="form-label">代码</label>
      <input ...>
    </div>
  </div>
  ...
</div>
```

**同步修复**：
- `selectRecordCategory(type)` 函数（[index.html:6273-L6275](file:///workspace/index.html#L6273-L6275)）中有 `typeSelect.value = type;` 这行会报 null，需要改成 `if (typeSelect) typeSelect.value = type;` 或直接删除
- JS 引用 `document.getElementById('recordAddType')` 的地方都要做空值判断

### 风险
- 用户无法在该表单内再改分类，符合需求（分类在 sheet 顶部一次性选择）
- 但需要确认：未选分类时进入新增会怎样？查 `handleRecordAddNew()` → 6297-6304：使用 `activeRecordCategory`（全局状态），已选好才进入

---

## 需求 3：去除记资产搜索行左侧"资产头像"方块和"+ 新增一只股票 / 港美股"中的"港美股"

**文件**：`/workspace/index.html`
**位置**：
- 头像方块 CSS：[index.html:2153-L2165](file:///workspace/index.html#L2153-L2165)
- 头像方块 HTML：[index.html:6569](file:///workspace/index.html#L6569)
- "港美股" 文案：[index.html:6278](file:///workspace/index.html#L6278)

### 现状问题
- 搜索结果每行最左侧有彩色方块（28×28 圆角矩形，写"股"/"基"/"金"等）——用户认为多余
- 新增按钮文案"新增一只股票 / 港美股"——"港美股"赘述，应改为"新增一只股票"

### 改动方案
1. **删除方块**：
   - 移除 CSS 中 `.sr-type-dot` 块（2153-2165 行）以及颜色定义
   - 移除 HTML 中 `<div class="sr-type-dot" style="...">...</div>`
   - 调整 `.asset-search-row` 的 `gap` 从 `10px` → `0`，去掉方块占位
   - 名称行 `padding-left` 调整（如有必要）

2. **删除"港美股"**：
   ```js
   // 原
   stock: '新增一只股票 / 港美股',
   // 改为
   stock: '新增一只股票',
   ```
   顺便检查其他类别文案：
   - fund/etf/metal/deposit/wealth/other 保持不变（已合理）

### 风险
- 失去视觉类别区分：但因为同一 sheet 内**当前已按选定类别过滤**（见 [index.html:6533-L6568](file:///workspace/index.html#L6533-L6568) 渲染函数），用户看到的列表本来就全是同一类别，方块冗余
- 若需要保留弱类别提示，可在名称旁加 inline 类别小文字（如 `[股票]`），但需求要求"去除"，不做额外添加

---

## 需求 4：持仓列表（主页"持仓 6 项资产"）仿图 6 重新设计

**文件**：`/workspace/index.html`
**位置**：
- 列表头部（"持仓 6项资产"区块）：[index.html:3953-L3999](file:///workspace/index.html#L3953-L3999)
- 6 个 asset-item：[index.html:4001-L4156](file:///workspace/index.html#L4001-L4156)
- 现有 CSS：[index.html:533-L766](file:///workspace/index.html#L533-L766)

### 现状问题
- 当前是**三行布局**：标题（市值）/ 横向 meta（持仓天数·持仓量·成本价·股价）/ 价格+盈亏
- 用户希望：参考图 6 风格——**字段名+值依次罗列到行尾**，**最上方增加字段说明行**

### 改动方案（参考图 6 + 图 1 极简风）

#### 1. 在 #assetList 上方增加"字段说明行"（类似 Excel 表头）
```html
<div class="asset-list-header">
  <span>资产</span>
  <span>持仓量</span>
  <span>成本价</span>
  <span>现价</span>
  <span>今日</span>
  <span>持仓盈亏</span>
</div>
<div id="assetList">...</div>
```

#### 2. 重构每条 asset-item 为单行多列布局
仿图 6：左资产名 + 中间依次罗列「持仓量 / 成本价 / 现价 / 今日盈亏 / 持仓盈亏」

```html
<div class="asset-item">
  <div class="col-name">
    <span class="asset-name">贵州茅台</span>
    <span class="asset-sub">600519 · 股票</span>
  </div>
  <div class="col-qty">100 股</div>
  <div class="col-cost">¥1,500.00</div>
  <div class="col-price">¥1,916.00</div>
  <div class="col-today up">+¥1,400<br>+0.74%</div>
  <div class="col-pnl up">+¥41,600<br>+27.73%</div>
</div>
```

#### 3. CSS 关键样式
```css
.asset-list-header {
  display:grid;
  grid-template-columns: 2fr 1fr 1.1fr 1.1fr 1.3fr 1.5fr;
  padding:10px 18px;
  font-size:11px;
  color:var(--text-muted);
  text-transform:uppercase;
  letter-spacing:0.05em;
  border-bottom:1px solid var(--border);
  background:var(--card);
  margin:0 16px 0;
  border-radius:18px 18px 0 0;
}
.asset-list-header span { text-align:right; }
.asset-list-header span:first-child { text-align:left; }

.asset-item {
  display:grid;
  grid-template-columns: 2fr 1fr 1.1fr 1.1fr 1.3fr 1.5fr;
  align-items:center;
  padding:14px 18px;
  background:var(--card);
  position:relative;
  border-bottom:1px solid rgba(164,74,63,0.05);
  cursor:pointer;
  text-align:right;
  font-variant-numeric:tabular-nums;
}
.asset-item + .asset-item::before { display:none; } /* 改用 grid 自身的 border-bottom */
.asset-item > div { text-align:right; }
.asset-item .col-name { text-align:left; }
.col-name .asset-name { font-size:15px; font-weight:700; }
.col-name .asset-sub { font-size:11px; color:var(--text-muted); display:block; margin-top:2px; }
.col-today, .col-pnl { font-size:12px; font-weight:600; line-height:1.35; }
.col-today.up, .col-pnl.up { color:#d14b4b; }
.col-today.down, .col-pnl.down { color:#2e8b57; }
```

#### 4. 兼容性处理
- 现有 sort 逻辑（`getAssetData()`）依赖 `.asset-row-meta` `.asset-row-price` 等结构 → 需要**同步改 JS 解析**
- 检查点：[index.html:5359-L5423](file:///workspace/index.html#L5359-L5423)（排序/过滤函数）
- 简化：因字段都是 data-* 属性渲染静态 HTML，JS 可能直接读 `data-*`，改动有限
- 类别差异：股票/基金/ETF 显示「数量·成本·现价·盈亏」；存款/理财显示「本金·年化·到期日·本息」→ **可保留分组渲染**，但单元格改为「本金 / 年化 / 到期日 / 预期本息 / 持有利息 / 持有盈亏」

#### 5. 移动端适配
- `grid-template-columns` 在 ≤360px 屏可改为 `repeat(6, minmax(60px, 1fr))`，但**实测 360px 视口已可放下**（图 5 截图就是 iPhone 12/13 Pro 尺寸）
- 小屏下隐藏部分次要列：`@media (max-width:380px) { .col-cost { display:none; } }`

### 风险
- **影响排序逻辑**：`sortAssetList()` 解析 HTML 的方式要重写或读 data 属性
- **影响空状态**：`.asset-empty-state` 仍能正常显示
- **影响详情点击**：保留 `onclick="openAssetSheet('600519')"`

---

## 涉及文件 & 模块总览

| 文件 | 修改点 | 行数 |
|---|---|---|
| `index.html` | 历史笔记 sheet 卡片样式去边框/边距/圆角 | 1684-1697 |
| `index.html` | 资产分类下拉框删除 | 4695-4706 |
| `index.html` | `selectRecordCategory` 修复 `typeSelect` 空指针 | 6274-6275 |
| `index.html` | `.sr-type-dot` CSS 删除 | 2153-2165 |
| `index.html` | `renderRecordSearchResults` 删除方块 HTML | 6569 |
| `index.html` | "新增一只股票 / 港美股" → "新增一只股票" | 6278 |
| `index.html` | 持仓列表：表头 + 6 列 grid + 6 条 asset-item 全部重渲染 | 4001-4156 |
| `index.html` | 持仓列表 CSS 重写为 grid 布局 | 595-766（重写） |
| `index.html` | 排序函数 `sortAssetList` 同步调整 | 5359-5423 |

---

## 验证步骤

1. 浏览器访问 `http://localhost:8000/?v=N`（每次构建后 v 参数递增防缓存）
2. **需求 1 验证**：底部 Tab 切到"笔记" → 点"历史笔记 3"按钮 → 弹出半弹框，笔记卡片无圆角无边框，相邻卡片仅 1px 分隔线，整体白底顶满
3. **需求 2 验证**：底部 Tab 切到"资产" → 点"记资产" → 选"股票" → 列表底部点"+ 新增一只股票" → 进入新增表单，**没有"资产分类"下拉框**，直接是名称/代码/数量/成本/价格/建仓日期
4. **需求 3 验证**：在记资产 sheet 内，搜索结果行**没有彩色方块**；底部按钮文案是"+ 新增一只股票"（不是"港美股"）
5. **需求 4 验证**：底部 Tab 在"资产"页面 → 持仓区块最上方有字段说明行（小写英文 "资产 / 持仓量 / 成本价 / 现价 / 今日 / 持仓盈亏"）；6 条资产每条都是单行 6 列布局，数值列右对齐
6. 模拟器上点击资产行仍能进入详情；排序功能（市值↑/盈亏↑/涨跌幅↑）仍生效

---

## 改动总览图

```
┌─────────────────────────────────────────────┐
│ 历史笔记 sheet（图2→仿图1）                │
│  ✗ 圆角边框 → ✓ 1px 顶满分隔线              │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 记资产 → 新增表单                            │
│  ✗ 资产分类下拉 → ✓ 直接进入输入             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 记资产 → 搜索行                              │
│  ✗ 左侧彩色方块 → ✓ 删                       │
│  ✗ "+ 新增一只股票 / 港美股" → ✓ "+ 新增一只股票" │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 持仓列表（图5→仿图6）                        │
│  ✗ 三行布局 → ✓ 表头 + 单行 6 列              │
│  新增表头：资产/持仓量/成本价/现价/今日/持仓盈亏 │
└─────────────────────────────────────────────┘
```

---

## 风险 & 兜底

1. **风险**：排序功能破坏
   **兜底**：先备份 `sortAssetList` 函数，关键 data-* 属性保留在 `asset-item` 上，回退方案是只把渲染模板改 CSS，JS 解析逻辑保持原样

2. **风险**：分类下拉框删除后，`recordAddType` 引用未清理导致 console 报错
   **兜底**：用 `if (typeSelect) typeSelect.value = type;` 防御性写法

3. **风险**：搜索行删方块后缺少视觉锚点
   **兜底**：在 `sr-info` 内的 `sr-name-line` 末尾补一个极小的类别文字 `<span class="sr-type-text">股票</span>`（颜色用 var(--text-muted)），保持信息量
