# JinJI App 二次重构计划

## 1. Summary

根据用户的最新规划与手绘原型图，对 JinJI 投资组合管理 PWA 进行第二轮结构与样式调整：

- **首页概览区瘦身**：去除数据栏（资产变动/收益率/前值/当前 4 格 grid），仅保留 K 线图，并参考图1样式优化为带"标的 + 净值 + 负债"摘要卡片、网格 + 双折线（K线+收益率）的复合展示；
- **新增"记资产/记笔记"入口**：在首页**概览与持仓的分界处**新增一行两按钮（记资产 → 原 `openRecordSheet()`、记笔记 → `switchTab('insights')` + 聚焦输入）；
- **资产详情页优化**：将"笔记预测价"改名为"笔记预测"；在该板块下新增"交易记录"按钮，点击后打开该资产的交易记录视图；
- **"我的"页面重构**：删除"记资产/记笔记"子 Tab 模式，改为平铺 5 个菜单项（管理账户 / 交易记录 / 历史笔记 / 个人信息 / 隐私政策）；点击"交易记录"和"历史笔记"对应跳转至相关页面（沿用 `switchTab` 方式）。

## 2. Current State Analysis

### 2.1 文件结构

- `/workspace/index.html`：单页应用（HTML + 内联 CSS + 内联 JS），约 4800+ 行。
- `/workspace/jinji-mini/`：微信小程序版本（本次不影响）。
- `/workspace/.trae/documents/jinji-app-refactor-plan.md`：上一轮重构计划（参考）。

### 2.2 现有首页概览结构

`/workspace/index.html#L2769-L2836`：
- `.summary-card`（L2769）：总资产 + 今日盈亏 + 隐私按钮。
- `.stats-panel`（L2794）：含 `.stats-grid`（4 格：资产变动/收益率/前值/当前）+ `.stats-kline`（K线 + 收益率线）。

**K 线实现**：[updateTotalAssetKline](file:///workspace/index.html#L4434-L4500)，绘制 K 线蜡烛 + 收益率折线。

### 2.3 现有资产详情页结构

`/workspace/index.html#L3629-L3701`：
- 顶部"资产明细"块（6 个 detail-card）。
- "**笔记预测价**" `.prediction-panel`（L3682）：含 3 类阵营比例 + 笔记列表 + 警告。

`renderPredictions` ([file:///workspace/index.html#L4955-L4971](file:///workspace/index.html#L4955-L4971))：渲染预测项 DOM。

### 2.4 现有"我的"页面结构

`/workspace/index.html#L3142-L3346`（上一轮重构后）：
- `me-header` 头像 + 4/12/3 统计。
- `me-tabbar` 切换 2 个子 Tab（记资产/记笔记）。
- `mePaneAssets`：账户 + 交易记录（8 笔）+ 资产管理（4 项）。
- `mePaneNotes`：笔记管理（3 条）。

### 2.5 关键函数

- `switchTab(tabName)` (L3725)：底部 Tab 切换。
- `openRecordSheet(type?)` (L4123)：打开"记一笔"全屏表单。
- `openAssetSheet(code)` (L4836)：打开资产详情底部弹层。
- `openInsightInput()` (L3771)：跳到 `page-insights` 并聚焦输入。
- `deleteAsset(code)` (L3753) / `deleteNote(id)` (L3764)。
- `renderPredictions(notes)` (L4955)：渲染笔记预测。

### 2.6 用户提供的设计图要点（图1 K线）

- 顶部小卡片：`2025/7/8` 日期 + 「我的净资产 ¥1,236,600 / 负债 ¥1,005,000」+ 右侧 › 跳转。
- 主体：`0 / 500K / 1M` Y 轴刻度 + `9月 12月 3月 6月 9月` X 轴时间刻度。
- 复合线条：黑/灰色阶梯线（K线/净资产）+ 红色实线（收益率）+ 红色圆点标记 + 红色虚线垂直参考线。
- 底部时间切换：`30天 / 6月 / 1年 / 自定义` 4 选 1。

## 3. Proposed Changes

### 3.1 首页概览：去除 4 格数据栏，K线重做为图1样式

**文件**：`/workspace/index.html#L2769-L2836`

**变更**：
- 删除 `.stats-grid`（含 4 个 `.stats-item`：资产变动/收益率/前值/当前）。
- 改造 `.stats-panel`：顶部新增"净资产摘要小卡片"（日期 + 净资产 + 负债 + › 跳转图标）；主体绘制图1样式复合 K 线（阶梯线 + 收益率折线 + 标记点 + 参考线）；底部加 4 个时间范围切换 chip（30天/6月/1年/自定义）。
- 保留 `.summary-card`（总资产 + 今日盈亏 + 隐私按钮），不删除。

**新增 HTML 结构**（替换原 `.stats-panel`）：
```html
<div class="stats-panel" id="homeStatsPanel">
  <div class="stats-summary-card" onclick="showToast('查看净资产构成')">
    <div class="stats-summary-info">
      <span class="stats-summary-date" id="statsSummaryDate">2026/5/21</span>
      <span class="stats-summary-net">我的净资产 ¥1,236,600</span>
      <span class="stats-summary-debt">负债 ¥1,005,000</span>
    </div>
    <svg class="stats-summary-arrow" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
  </div>
  <div class="stats-chart-wrap">
    <svg class="kline-chart-svg" viewBox="0 0 120 96" preserveAspectRatio="none" aria-label="总资产K线">
      <g id="klineYAxis"></g>
      <g id="klineXAxis"></g>
      <line class="kline-grid" x1="14" y1="20" x2="114" y2="20"/>
      <line class="kline-grid" x1="14" y1="46" x2="114" y2="46"/>
      <line class="kline-grid" x1="14" y1="72" x2="114" y2="72"/>
      <g id="klineRefLine"></g>
      <g id="klineStepSeries"></g>
      <g id="klineReturnSeries"></g>
    </svg>
  </div>
  <div class="stats-range-bar" id="statsRangeBar">
    <div class="stats-range-indicator" id="statsRangeIndicator"></div>
    <button class="stats-range active" data-range="30d" onclick="setKlineRange('30d')">30天</button>
    <button class="stats-range" data-range="6m" onclick="setKlineRange('6m')">6月</button>
    <button class="stats-range" data-range="1y" onclick="setKlineRange('1y')">1年</button>
    <button class="stats-range" data-range="custom" onclick="setKlineRange('custom')">自定义</button>
  </div>
</div>
```

**新增 CSS**（在 `.stats-kline` 附近）：
- `.stats-summary-card`：白底圆角 12px，padding 12-14px，flex space-between，点击态浅灰。
- `.stats-summary-info` flex column。
- `.stats-summary-date` 12px muted。
- `.stats-summary-net` 14-15px 加粗。
- `.stats-summary-debt` 12px muted。
- `.stats-summary-arrow` 16px fill muted。
- `.stats-chart-wrap`：扩大 `.kline-chart-svg` 高度至 ~160-180px（原 76px），加大字体至 8-9px。
- `.kline-axis-label` 字号从 7px → 8-9px。
- `.stats-range-bar`：参考 `.mode-switch` 模式切换器样式（flex + 圆角胶囊 + 滑动指示器）。
- `.stats-range` flex:1，padding 7-9px，14px 字号。

**新增 JS 函数**：
```javascript
let currentKlineRange = '30d';
function setKlineRange(range) {
  currentKlineRange = range;
  document.querySelectorAll('.stats-range').forEach(b => 
    b.classList.toggle('active', b.dataset.range === range));
  const idx = ['30d','6m','1y','custom'].indexOf(range);
  const indicator = document.getElementById('statsRangeIndicator');
  if (indicator) indicator.style.transform = `translateX(${idx * 100}%)`;
  // 根据 range 调整 totalAssetKlineDays 切片
  const sliceMap = { '30d': 30, '6m': 180, '1y': 365, 'custom': 30 };
  const slicedDays = (window.totalAssetKlineDays || []).slice(-sliceMap[range]);
  updateTotalAssetKline(slicedDays);
  if (range === 'custom') showToast('自定义时间范围（演示）');
}
```

**改造 `updateTotalAssetKline`**：
- 修改 viewBox 从 `0 0 120 72` → `0 0 120 96`。
- 加大字号，更新轴渲染（Y 轴 0/500K/1M；X 轴 月份标签）。
- 增加阶梯线（黑色）+ 收益率线（红色实线 + 圆点 + 红色虚线参考线）。

### 3.2 新增"记资产 / 记笔记"两个首页入口

**文件**：在 `page-portfolio` 中，`.stats-panel` 与 `.holdings-toolbar` 之间新增。

**HTML**：
```html
<div class="home-quick-actions">
  <button class="home-quick-btn" onclick="openRecordSheet()">
    <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z"/></svg>
    <span>记资产</span>
  </button>
  <button class="home-quick-btn" onclick="openInsightInput()">
    <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
    <span>记笔记</span>
  </button>
</div>
```

**CSS**：
- `.home-quick-actions` flex，gap 12px，margin 0 16px 12px。
- `.home-quick-btn` flex:1，背景 `var(--card)`，圆角 12-14px，padding 12px 14px，flex 居中（icon + 文字），点击态：active scale(0.98)。

### 3.3 资产详情：重命名"笔记预测价"为"笔记预测"，新增"交易记录"按钮

**文件**：`/workspace/index.html#L3682-L3698`

**变更**：
- `<span class="panel-title">笔记预测价</span>` → `<span class="panel-title">笔记预测</span>`。
- 在 `.prediction-panel` 末尾、`<div id="predictionList">` 之后、`#notesWarning` 之前，新增"交易记录"按钮。
- 该按钮点击后调起 `openAssetTransactions(code)`，打开该资产的交易记录视图（新建一个简单弹层，列出该资产所有交易）。

**HTML 新增**（插在 `#notesWarning` 之前）：
```html
<button class="prediction-action-btn" onclick="openAssetTransactions(activeAssetData.code)">
  <svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
  <span>交易记录</span>
  <span class="prediction-action-count" id="assetTxnCount">8 笔</span>
</button>
```

**新增 CSS**：
- `.prediction-action-btn`：白底圆角，flex space-between，padding 12px 14px，margin-top 12px。
- `.prediction-action-count`：右侧 muted 数字胶囊。

**新增 JS 函数**：
```javascript
function openAssetTransactions(code) {
  // 简单方案：复用 showToast + 滚动到顶部展示交易记录
  // 演示用：调起一个 mock 弹层或 toast
  showToast(`查看 ${code} 的交易记录（共 8 笔）`);
  // 真实实现可在此处 setTimeout + renderAssetTransactions
}
```

### 3.4 "我的"页面重构：删除"记资产/记笔记"子 Tab

**文件**：`/workspace/index.html#L3169-L3346`

**变更**：
- 删除 `.me-tabbar` + `.me-pane`（包括两个面板内容）。
- 新增 5 个平铺菜单项（管理账户 / 交易记录 / 历史笔记 / 个人信息 / 隐私政策）。
- 删除 `switchMeTab` 函数。
- 删除 `openInsightInput` 中关于"我的"路径的引用（保留函数本身用于首页"记笔记"入口）。
- "交易记录"和"历史笔记"点击后：
  - 交易记录：复用 `switchTab('insights')` + 后续提示/或 `switchTab('portfolio')` 后滚动（用户原意是"跳转页面"，结合澄清回答采用 `switchTab` 复用）。
  - 历史笔记：`switchTab('insights')` 跳到分析页并展示历史笔记列表（聚焦 `.insight-history` 滚动）。

**新版 HTML**（替换原 Tab + 面板）：
```html
<div class="me-section">
  <div class="me-section-title">账户与数据</div>
  <div class="me-menu">
    <div class="me-menu-item" onclick="openAccountModal()">
      <div class="me-menu-left">
        <svg class="me-menu-icon" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        <span class="me-menu-label">管理账户</span>
      </div>
      <svg class="me-menu-arrow" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
    </div>
    <div class="me-menu-item" onclick="openTransactionHistory()">
      <div class="me-menu-left">
        <svg class="me-menu-icon" viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>
        <span class="me-menu-label">交易记录</span>
        <span class="me-menu-count">12</span>
      </div>
      <svg class="me-menu-arrow" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
    </div>
    <div class="me-menu-item" onclick="openNoteHistory()">
      <div class="me-menu-left">
        <svg class="me-menu-icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
        <span class="me-menu-label">历史笔记</span>
        <span class="me-menu-count">3</span>
      </div>
      <svg class="me-menu-arrow" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
    </div>
  </div>
</div>

<div class="me-section">
  <div class="me-section-title">个人信息</div>
  <div class="me-menu">
    <div class="me-menu-item" onclick="openPersonalInfo()">
      <div class="me-menu-left">
        <svg class="me-menu-icon" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
        <span class="me-menu-label">个人信息</span>
      </div>
      <svg class="me-menu-arrow" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
    </div>
    <div class="me-menu-item" onclick="openPrivacyPolicy()">
      <div class="me-menu-left">
        <svg class="me-menu-icon" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
        <span class="me-menu-label">隐私政策</span>
      </div>
      <svg class="me-menu-arrow" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
    </div>
  </div>
</div>
```

**新增 CSS**（与 `.me-menu-item` 同区块）：
- `.me-menu-count` 数字胶囊（参考 `.me-section-count` 样式）。

**新增 JS 函数**：
```javascript
function openTransactionHistory() {
  switchTab('insights');
  setTimeout(() => {
    // 在 insights 页内通过 toast 提示或后续展开
    showToast('交易记录（演示）');
  }, 200);
}

function openNoteHistory() {
  switchTab('insights');
  setTimeout(() => {
    const history = document.querySelector('.insight-history');
    if (history) history.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 250);
}

function openPersonalInfo() {
  showToast('个人信息（演示）');
}

function openPrivacyPolicy() {
  showToast('隐私政策（演示）');
}
```

**删除/简化**：
- 删除 `switchMeTab` 函数（L3741-L3751）。
- 保留 `openInsightInput`（首页"记笔记"入口仍用）。

## 4. Assumptions & Decisions

| # | 假设/决策 | 说明 |
|---|----------|------|
| 1 | 顶部 `.summary-card`（总资产/今日盈亏 + 隐私按钮）保留 | 用户原话只说"去除数据栏"，4 格 grid 才是数据栏；隐私模式总资产仍需展示。 |
| 2 | 资产详情"交易记录"按钮采用 mock Toast 实现 | 原型阶段不创建新的全屏弹层，仅 toast 提示"查看 XXX 的交易记录（共 N 笔）"。 |
| 3 | 个人信息 / 隐私政策栏目均为 mock Toast | 原型阶段只需占位入口。 |
| 4 | 净资产摘要小卡片是装饰性展示 | 净资产=总资产+现金（mock 128,456+1,005,000≈1,236,600）；点击仅 toast 提示。 |
| 5 | K 线时间范围切换影响 `totalAssetKlineDays` 切片 | 不同范围用对应天数切片；自定义档位默认 30 天 + toast 提示。 |
| 6 | 删除子 Tab 后 `switchMeTab` 函数一并删除 | 不再被任何元素引用，避免遗留死代码。 |
| 7 | "历史笔记"点击后跳转 insights 页并滚动到历史笔记区 | 与设计图 3 中"历史笔记"作为独立入口的意图一致。 |
| 8 | 资产详情页"交易记录"按钮不重复删除逻辑 | 删除资产逻辑仅在"我的"和首页持仓保留；详情内只查看不删除。 |
| 9 | 持仓列表保留 | 用户未要求改动持仓列表，排序/筛选/详情交互全部保留。 |
| 10 | 资产详情"笔记预测"下方的笔记列表渲染逻辑不变 | 仍是 `renderPredictions(notes)`，仅标题改名 + 末尾追加按钮。 |

## 5. Verification

实施完成后按以下步骤验证：

1. **首页概览区**
   - 不再显示 4 格 grid（资产变动/收益率/前值/当前）。
   - 顶部小卡片显示日期 + "我的净资产 ¥1,236,600" + "负债 ¥1,005,000" + › 图标。
   - 主体 K 线图加大、含 Y 轴刻度（0/500K/1M）+ X 轴月份 + 阶梯线 + 红色收益率折线 + 标记点。
   - 底部 4 个时间范围切换 chip 可点击，指示器滑动。

2. **首页新增两入口**
   - 概览与持仓之间出现一行两个按钮："记资产" + "记笔记"。
   - "记资产"点击 → 调起 `openRecordSheet()`。
   - "记笔记"点击 → 切到 insights 页并聚焦输入框。

3. **资产详情**
   - 标题从"笔记预测价"改为"笔记预测"。
   - 笔记预测板块末尾出现"交易记录"按钮（含 8 笔 计数）。
   - 点击"交易记录"→ toast 提示"查看 XXX 的交易记录（共 8 笔）"。

4. **"我的"页面**
   - 不再有"记资产/记笔记"子 Tab。
   - 5 个菜单项：管理账户 / 交易记录（12）/ 历史笔记（3）/ 个人信息 / 隐私政策。
   - 点击"交易记录"→ 切到 insights + toast 提示。
   - 点击"历史笔记"→ 切到 insights 并滚动到历史笔记区。
   - 点击"个人信息"/"隐私政策"→ toast 提示。

5. **未受影响功能**
   - 持仓列表（排序/筛选/详情）功能不变。
   - 资产详情其他模块（资产明细编辑、笔记预测、笔记冲突警告）不变。
   - 隐私模式切换不变。
   - 笔记分析 / 历史笔记展开不变。

6. **iOS PWA**
   - 底部 Tab Bar 仍正确适配 `env(safe-area-inset-bottom)`。

7. **Git 提交**
   - 提交 commit：`refactor: 首页概览瘦身+新增记资产/记笔记入口+资产详情交易记录+我的页面5栏目重构`。
   - 推送到 main 分支。
