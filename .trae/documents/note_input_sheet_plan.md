# 记笔记页改为弹出半弹框

## 需求
将当前「记笔记」页（insights tab）改为弹出半弹框样式，与「记资产」「历史笔记」「交易记录」半弹框保持一致的交互风格。

## 现状分析
- 当前 `openInsightInput()` 调用 `switchTab('insights')` 切换到整页
- 整页包含：textarea 输入框 + 分析结果区域 + 历史笔记入口按钮
- 半弹框模式已有：历史笔记（`historyNotesModal`）、交易记录（`historyTransactionsModal`）、记资产（`recordSheet`）

## 修改方案

### 1. 新增 CSS（在历史笔记 sheet CSS 之后）
- `.note-input-sheet-body` 样式：textarea 区域 + 分析结果区域的滚动容器
- textarea 在 sheet 内的适配样式（去背景、全宽、合适高度）
- 分析结果区域在 sheet 内的适配样式

### 2. 新增 HTML 半弹框结构（在 `historyTransactionsModal` 之后）
- `modal-overlay#noteInputModal`
- 标题栏："记笔记" + "完成"按钮
- 内容区：textarea + 分析结果（从 insights page 迁移过来）
- 底部：历史笔记入口按钮（可选）

### 3. 修改 JS
- `openInsightInput()`: 改为打开半弹框而非 switchTab
- 新增 `closeNoteInputSheet()`: 关闭半弹框
- 保持 textarea 和分析结果的 DOM 引用不变（或迁移到新位置）

### 4. 文件
- `/workspace/index.html`：CSS + HTML + JS 全部在此文件

## 风险
- textarea 的 `id="insightInput"` 需要保持，因为多处 JS 引用它
- 分析结果区域 `id="analysisResult"` 同理
- 确保关闭半弹框后回到 portfolio tab（而非留在 insights tab）
