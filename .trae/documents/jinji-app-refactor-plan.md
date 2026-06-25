# 金汲（JinJI）App 重构计划

## 1. Summary

根据用户规划的产品需求与手绘原型图，对 JinJI 投资组合管理 PWA 原型进行以下结构性调整：

- **首页概览区**：维持总资产、K线图、今日盈亏、持仓等核心数据展示，移除首页的"记一笔"入口。
- **导航重构**：将底部 Tab Bar 由"资产 / 笔记 / 我的"（3个）改为"资产 / 我的"（2个）。原"笔记"页签整合到"我的"页面下作为子标签。
- **"我的"页面重构**：在"我的"页面内加入"记资产 / 记笔记"两个并列的子标签页（Tab 切换），并新增"交易记录"和"笔记管理"功能列表。
- **资产/交易流程**：明确新增资产（按类型选）、交易（买入/卖出）的入口收口在"我的 - 记资产"。

> 实施完成后，首页功能更聚焦（看数据），所有写入操作（记资产、记笔记、交易）统一在"我的"页面完成。

## 2. Current State Analysis

### 2.1 文件结构

- `/workspace/index.html`：单页应用（HTML + 内联 CSS + 内联 JS），约 4700+ 行。
- `/workspace/jinji-mini/`：微信小程序版本，本次不影响。
- `/workspace/work/screenshots/`：UI 截图与设计稿（参考用）。

### 2.2 现有 Tab 结构（底部导航）

`/workspace/index.html#L2970-L2983`：
```html
<div class="tab-bar">
  <div class="tab-item active" onclick="switchTab('portfolio')">...</div> <!-- 资产 -->
  <div class="tab-item" onclick="switchTab('insights')">...</div>            <!-- 笔记 -->
  <div class="tab-item" onclick="switchTab('me')">...</div>                  <!-- 我的 -->
</div>
```

### 2.3 现有页面元素

| 页面 ID | 内容 | 行号 |
|--------|------|------|
| `page-portfolio` | 概览卡片（总资产/今日盈亏 + 隐私按钮 + "记一笔"按钮）、K线图、持仓列表（含排序/筛选/详情） | L2553 |
| `page-insights` | AI 分析输入区、历史笔记列表 | L2724 |
| `page-me` | 头像、统计、当前演示数据卡片、账户管理 | L2927 |

### 2.4 关键交互入口

- `openRecordSheet()` (L4123)：打开"记一笔"全屏表单（含交易/新增两种模式切换）。
- `openAssetSheet(code)` (L4350)：打开资产详情底部弹层。
- `saveRecord(type)` (L4671)：保存交易或新增资产。
- `saveAnalysisToNote()` (L3692)：把 AI 分析存入笔记。
- 首页资产卡片中的"记一笔"按钮 (L2574) 调起 `openRecordSheet()`。
- 笔记页内的"新增资产"按钮 (L2789) 调起 `openRecordSheet('add')`。

### 2.5 现有样式与 CSS 变量

- 设计系统：`--brand #A44A3F`、`--positive #2E8B57`、`--negative #CD5C5C`、`--radius 24px` 等。
- 已有的"记一笔"用 `summary-add-btn` 样式 (L2574)。
- 已有 `me-section` / `me-section-title` / `me-menu` / `me-menu-item` 样式 (L2034-L2087)，可直接复用。
- 已有 `mode-switch` 模式切换器样式（"买入 / 卖出"），可用于"记资产 / 记笔记"子 Tab。

## 3. Proposed Changes

### 3.1 底部 Tab Bar 改 2 个 Tab

**文件**：`/workspace/index.html#L2970-L2983`

**变更**：
- 删除"笔记" Tab 项。
- 保留"资产"和"我的"。
- 更新 SVG 图标无变化（"资产"icon 保持原资产/钱包图标；"我的"icon 保持原人物图标）。
- 隐藏 `page-insights` 容器，改为"我的"页内子模块。

**实现**：
- 直接编辑 `<div class="tab-bar">`，删除第三个 `.tab-item`。
- 保留 `switchTab('insights')` 函数以避免引用报错，但不再从 Tab Bar 触发。

### 3.2 首页：移除"记一笔"按钮

**文件**：`/workspace/index.html#L2574`

**变更**：
- 删除 `<button class="summary-add-btn" onclick="openRecordSheet()">记一笔</button>`。
- 保留隐私眼睛按钮。
- `.summary-actions` 容器只保留隐私按钮。
- `summary-header` 布局保持 flex，隐私按钮继续靠右。

**实现**：
- 编辑 `.summary-actions` 节点，移除"记一笔"按钮。

### 3.3 "我的"页面重构：新增子 Tab 切换

**文件**：`/workspace/index.html#L2926-L2967`

**新增结构**（在 `me-header` 之后、`me-sync-card` 之前）：
```html
<div class="me-tabbar" id="meTabbar">
  <div class="me-tab-indicator" id="meTabIndicator"></div>
  <button class="me-tab active" data-tab="assets" onclick="switchMeTab('assets')">记资产</button>
  <button class="me-tab" data-tab="notes" onclick="switchMeTab('notes')">记笔记</button>
</div>
```

**新增两个面板**：
```html
<div class="me-pane" id="mePaneAssets">
  <div class="me-section">...</div>  <!-- 交易记录列表 -->
  <div class="me-section">...</div>  <!-- 资产管理入口（新增资产 / 现有资产修改&删除） -->
</div>

<div class="me-pane" id="mePaneNotes" style="display:none;">
  <div class="me-section">...</div>  <!-- 笔记管理列表（含编辑/删除/关联资产跳转） -->
</div>
```

**新增 CSS**（在 `.me-section` 相关样式附近）：
- `.me-tabbar`：flex 容器，圆角胶囊背景 `var(--input-bg)`，相对定位。
- `.me-tab-indicator`：绝对定位的背景条（参考已有 `mode-indicator` 模式指示器），切换时滑动。
- `.me-tab`：flex:1，文字 14px，padding 8-10px。
- `.me-tab.active`：加粗 + 品牌色 + 背景白。
- `.me-pane`：常规 block。
- `.me-pane[hidden]`：display:none。

### 3.4 "我的 - 记资产"面板内容

**子模块 A：交易记录**

```html
<div class="me-section">
  <div class="me-section-title">交易记录</div>
  <div class="me-menu">
    <div class="me-menu-item" onclick="openRecordSheet()">
      <div class="me-menu-left">
        <svg class="me-menu-icon">...</svg>
        <span class="me-menu-label">新增交易</span>
      </div>
      <span class="me-menu-arrow">+</span>
    </div>
  </div>
  <!-- 交易记录列表（mock 数据 12 条，可参考已有的 #me-stat-val=12） -->
  <div class="txn-list">
    <div class="txn-item">
      <div class="txn-main">
        <span class="txn-asset">贵州茅台</span>
        <span class="txn-time">2026-05-21</span>
      </div>
      <div class="txn-meta">
        <span class="txn-type buy">买入</span>
        <span class="txn-qty">100 份</span>
        <span class="txn-amount">+¥191,600</span>
      </div>
    </div>
    ...
  </div>
</div>
```

**子模块 B：资产管理（新增 / 修改 / 删除）**

```html
<div class="me-section">
  <div class="me-section-title">资产管理</div>
  <div class="me-menu">
    <div class="me-menu-item" onclick="openRecordSheet('add')">
      <div class="me-menu-left">
        <svg class="me-menu-icon">+</svg>
        <span class="me-menu-label">新增资产</span>
      </div>
      <span class="me-menu-arrow">›</span>
    </div>
  </div>
  <div class="me-asset-list">
    <div class="me-asset-item" data-code="600519">
      <div class="me-asset-name">贵州茅台 · 600519</div>
      <div class="me-asset-actions">
        <button class="me-asset-btn" onclick="openAssetSheet('600519')">查看/编辑</button>
        <button class="me-asset-btn danger" onclick="deleteAsset('600519')">删除</button>
      </div>
    </div>
    ...
  </div>
</div>
```

**样式**：
- `.txn-list` / `.txn-item`：参考已有 `.asset-item` 风格（白底圆角，padding 12-14px，行高 1.5）。
- `.txn-type.buy` 用 `--positive`；`.txn-type.sell` 用 `--negative`。
- `.me-asset-btn` 默认次按钮样式；`.me-asset-btn.danger` 红色边框。
- `.me-asset-list` 内为 `flex-direction: column; gap: 10px`。

### 3.5 "我的 - 记笔记"面板内容

```html
<div class="me-section">
  <div class="me-section-title">笔记管理</div>
  <div class="me-menu">
    <div class="me-menu-item" onclick="openInsightInput()">
      <div class="me-menu-left">
        <svg class="me-menu-icon">+</svg>
        <span class="me-menu-label">新增笔记</span>
      </div>
      <span class="me-menu-arrow">›</span>
    </div>
  </div>
  <div class="me-note-list">
    <div class="me-note-item" data-id="history-ai-chip">
      <div class="me-note-head">
        <span class="me-note-title">半导体：AI芯片需求持续增长</span>
        <span class="me-note-date">05-20</span>
      </div>
      <div class="me-note-tags">
        <span class="history-mini-tag up">看多</span>
        <span class="history-mini-tag">半导体</span>
      </div>
      <div class="me-note-actions">
        <button class="me-asset-btn" onclick="openNoteDetail('history-ai-chip')">查看</button>
        <button class="me-asset-btn danger" onclick="deleteNote('history-ai-chip')">删除</button>
      </div>
    </div>
    ...
  </div>
</div>
```

**样式**：
- `.me-note-item`：白底圆角，padding 12-14px。
- `.me-note-head` flex space-between。
- `.me-note-tags` 复用现有 `.history-mini-tag` 类。
- `.me-note-actions` 右对齐 flex 布局。

### 3.6 新增 JS 函数

```javascript
// "我的"页面 子 Tab 切换
function switchMeTab(tabName) {
  const tabs = document.querySelectorAll('.me-tab');
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  document.getElementById('mePaneAssets').style.display = tabName === 'assets' ? 'block' : 'none';
  document.getElementById('mePaneNotes').style.display = tabName === 'notes' ? 'block' : 'none';
  // 移动指示器
  const indicator = document.getElementById('meTabIndicator');
  const activeIdx = Array.from(tabs).findIndex(t => t.classList.contains('active'));
  indicator.style.transform = `translateX(${activeIdx * 100}%)`;
}

// 删除资产
function deleteAsset(code) {
  if (confirm(`确认删除 ${code}？该操作不可撤销。`)) {
    const el = document.querySelector(`.asset-item[data-code="${code}"]`);
    el?.remove();
    showToast('资产已删除');
  }
}

// 删除笔记
function deleteNote(id) {
  if (confirm('确认删除该笔记？')) {
    document.querySelector(`.me-note-item[data-id="${id}"]`)?.remove();
    showToast('笔记已删除');
  }
}

// 打开笔记输入（跳到记录页临时方案：滚动到 insight input）
function openInsightInput() {
  switchTab('insights');
  setTimeout(() => {
    document.getElementById('insightInput')?.focus();
  }, 200);
}

// 打开笔记详情
function openNoteDetail(id) {
  switchTab('insights');
  setTimeout(() => {
    const item = document.querySelector(`.history-item[data-history-id="${id}"]`);
    item?.classList.add('open');
    item?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 200);
}
```

### 3.7 我的页面统计数字

`/workspace/index.html#L2932-L2945` 的 4 资产 / 12 交易 / 3 笔记数字保持不变（demo 数据）。

## 4. Assumptions & Decisions

| # | 假设/决策 | 说明 |
|---|----------|------|
| 1 | 笔记 Tab 整体移除 | 避免在两处入口（首页 Tab + 我的子 Tab）切换造成混乱。统一从"我的 - 记笔记"进入。`#page-insights` 容器保留但默认不显示。 |
| 2 | "记一笔" 从首页移除 | 用户已确认首页功能聚焦（只读），写操作统一到"我的"。 |
| 3 | "我的" 子 Tab 用 "记资产 / 记笔记" 而非"交易/笔记" | 与用户原话"记资产和记笔记"保持一致。 |
| 4 | 删除资产/笔记为前端 mock 行为 | 原型阶段，确认弹窗 + 移除 DOM 节点即可，不需要真实持久化。 |
| 5 | "新增交易"复用 `openRecordSheet()` | 不再是首页"记一笔"专用，移到"我的 - 记资产"内。 |
| 6 | "新增资产"复用 `openRecordSheet('add')` | 同上。 |
| 7 | 子 Tab 切换指示器使用 `transform: translateX()` 动画 | 与已有 `mode-indicator` 一致风格。 |
| 8 | 交易记录与笔记管理使用 mock 静态数据 | 12 笔交易和 3 条笔记的 demo 数据与 `me-stat` 数字对应。 |
| 9 | 笔记输入仍走 `page-insights` 的 textarea | 原 `analyzeText()` 流程不破坏，只是入口从首页 Tab 改为"我的 - 记笔记"+"新增笔记"按钮。 |
| 10 | `page-insights` 容器不删除 | 保留 HTML 容器但不默认显示，避免影响 `switchTab` 兼容与 `analyzeText` 行为。 |

## 5. Verification

实施完成后按以下步骤验证：

1. **底部 Tab 数量**
   - 打开 http://localhost:8000/index.html，底部 Tab Bar 应只显示"资产 / 我的"两个 Tab。

2. **首页无"记一笔"按钮**
   - 概览卡片右上角应只剩"眼睛"按钮。

3. **"我的"页面 Tab 切换**
   - 点击"我的" Tab，进入"我的"页面。
   - 顶部应有"记资产 / 记笔记"两个子 Tab 切换，默认在"记资产"。
   - 点击"记笔记"，面板切换；指示器滑动。

4. **记资产面板**
   - 可见"交易记录"区：mock 12 笔交易，含日期、资产名、买入/卖出、份数、金额。
   - 可见"资产管理"区：4 项资产，每项有"查看/编辑"和"删除"按钮。
   - 点击"新增资产"调起 `openRecordSheet('add')`，能弹出新增表单。
   - 点击"新增交易"调起 `openRecordSheet()`，能弹出交易表单。
   - 点击"删除"，弹确认框。

5. **记笔记面板**
   - 可见"笔记管理"区：3 条笔记，每条有"查看"和"删除"按钮。
   - 点击"新增笔记"，自动跳到 `page-insights` 并聚焦输入框。
   - 点击"查看"，跳到 `page-insights` 并展开该条笔记。

6. **首页资产详情**
   - 资产详情弹层（`openAssetSheet`）功能不变。
   - 笔记冲突检测、买卖价/份数等表单交互不变。

7. **隐私模式**
   - 眼睛切换 + 数字动画不变。

8. **iOS PWA**
   - 底部 Tab Bar 仍正确适配 `env(safe-area-inset-bottom)`。

9. **Git 提交**
   - 提交 commit：`refactor: 重构我的页面 - 整合记资产/记笔记/交易记录/笔记管理子模块，移除首页"记一笔"和底部"笔记"Tab`。
   - 推送到 main 分支。
