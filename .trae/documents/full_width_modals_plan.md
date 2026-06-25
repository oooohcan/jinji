# 所有弹出框宽度扩至与页面一致

## 需求
将所有弹出半弹框（记资产、历史笔记、记笔记、交易记录、资产详情）的宽度扩至与页面宽度一致，消除左右缝隙，仅保留顶部圆角。

## 现状分析

### 受影响的弹出框及当前宽度规则

1. **记资产 sheet**（`#recordSheet`）— 使用 `.record-sheet` 类
2. **交易记录 sheet**（`#historyTransactionsModal`）— 使用 `.record-sheet` 类
3. **历史笔记 sheet**（`#historyNotesModal`）— 使用 `.record-sheet` 类 + 单独 `width:96%` 覆盖
4. **记笔记 sheet**（`#noteInputModal`）— 使用 `.record-sheet` 类 + 单独 `width:96%` 覆盖
5. **资产详情 modal**（`.asset-detail-modal`）— 使用 `.asset-detail-card` 类

### 当前 CSS 规则位置

- [index.html:2129-L2146](file:///workspace/index.html#L2129-L2146)：`.record-sheet, .modal-content, .asset-detail-card` 基础规则
  - `width:calc(100% - 32px)` — 左右各 16px 缝隙
  - `max-width:398px` — 限制最大宽度
  - `border-radius:20px 20px 0 0` — 顶部圆角（保留）

- [index.html:1550-L1552](file:///workspace/index.html#L1550-L1552)：`#historyNotesModal .record-sheet` 覆盖
  - `width:96% !important; max-width:96% !important;` — 左右各 2% 缝隙

- [index.html:1565-L1567](file:///workspace/index.html#L1565-L1567)：`#noteInputModal .record-sheet` 覆盖
  - `width:96% !important; max-width:96% !important;` — 左右各 2% 缝隙

## 修改方案

### 步骤 1：修改基础宽度规则（index.html:2129-L2133）

将 `.record-sheet, .modal-content, .asset-detail-card` 的：
- `width:calc(100% - 32px)` → `width:100%`
- `max-width:398px` → `max-width:100%`
- `border-radius:20px 20px 0 0` → 保持不变（仅顶部圆角）

### 步骤 2：修改历史笔记 sheet 覆盖规则（index.html:1550-L1552）

将 `#historyNotesModal .record-sheet` 的：
- `width:96% !important` → `width:100% !important`
- `max-width:96% !important` → `max-width:100% !important`

### 步骤 3：修改记笔记 sheet 覆盖规则（index.html:1565-L1567）

将 `#noteInputModal .record-sheet` 的：
- `width:96% !important` → `width:100% !important`
- `max-width:96% !important` → `max-width:100% !important`

### 步骤 4：验证

- 浏览器截图验证所有 5 个弹出框宽度是否贴边
- 确认顶部圆角保留、底部无圆角

## 涉及文件
- `/workspace/index.html`（唯一文件，所有 CSS 在此）

## 风险
- 无。仅修改宽度值，不影响布局结构或交互逻辑。
