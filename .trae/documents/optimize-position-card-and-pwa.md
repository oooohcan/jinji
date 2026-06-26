# 持仓卡片与 PWA UI 优化计划（修订版）

## 概要

针对用户提出的 5 个 UI 优化需求，全部修改单文件 `/workspace/index.html`，然后推送到 main 分支。

## 现状（已通过 git reflog + log 确认）

- 仓库是干净的 clone：`git reflog` 仅显示 `clone from origin` 和一次 checkout
- 没有 `8ca5d79` 这个提交，意味着之前会话记录的"已推送"状态在本次会话中并不存在
- 当前 HEAD 在 `trae/solo-agent-HVYcEO` 分支（`b4184fb`）
- main 指针在 `5cefa0c feat: 生成项目Code Wiki文档`
- `b4184fb` 与 `5cefa0c` 在 index.html 上**没有实质差异**（都是缺这 5 个修复的版本）
- 因此无需 merge / cherry-pick，直接在 trae 分支修改 → 推 main 即可

## 需要修改的文件

- `/workspace/index.html`（唯一）

## 5 项修复实施步骤

### 修复 1：持仓卡片 · 颜色统一（与持仓盈亏同色）
位置：`.asset-pnl` 规则（行 488）后追加：
```css
.asset-pnl .pnl-separator { color: inherit; }
```
原因：当前 `.asset-pnl` 已经有 `up`/`down` 颜色，但 `·` 在 HTML 文本节点中默认继承父级文字色，需显式声明 `color: inherit` 让其随父元素（`.asset-pnl.up` 或 `.asset-pnl.down`）一起变色。

### 修复 2：持仓卡顶部圆角改为直角
位置：行 495 后追加：
```css
#assetList {
  margin: 0 16px;
  background: var(--card);
  box-shadow: var(--shadow);
  overflow: hidden;
  border-radius: 0 0 var(--radius) var(--radius);
}
#assetList .asset-item:first-child {
  border-top: none;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}
```
原因：让卡片外层容器只有底部圆角，第一个 asset-item 顶部变直角，与下方卡片顶部对齐。

### 修复 3：持仓明细弹窗布局优化
涉及 4 处：

#### 3a. CSS（行 1174-1189 区域）
- `.asset-detail-title` 从 `flex-direction: column` 改为 `flex-direction: row; align-items: baseline; flex-wrap: nowrap; flex: 1; min-width: 0;`
- `.asset-detail-code` 加 `white-space: nowrap;`
- `.asset-detail-name` 加 `white-space: nowrap;`
- 新增 `.asset-detail-category` 样式（短字体、圆角小标签、横向不换行）

#### 3b. HTML（行 2172-2175）
模板中把 code/name/category 调整为横置顺序：code → name → category

#### 3c. "观点分歧" 不换行（行 2239-2242）
`.notes-warning` 添加 `white-space: nowrap; flex-shrink: 0;`

#### 3d. JS（`openAssetDetail` 函数，约行 2720）
补充 `document.getElementById('detailAssetCategory').textContent = asset.category || '股票';`

### 修复 4：iOS 26 PWA 底部空白
位置：行 60、79、85
- `.page` 的 `bottom: 72px` → `bottom: calc(72px + env(safe-area-inset-bottom))`
- `.tab-bar` 的 `height: 72px` → `height: calc(72px + env(safe-area-inset-bottom))`
- `.tab-bar` 的 `padding: 8px 0 20px` → `padding: 8px 0 calc(20px + env(safe-area-inset-bottom))`

viewport meta 已有 `viewport-fit=cover`（行 5），不需要改。

### 修复 5：截图验证
由于当前环境：
- 沙箱无 `apt` 网络下载系统库（libatk、libcups 等）
- `agent-browser install` 下载的 Chrome 二进制无法启动（缺库）
- Playwright 自带 chromium 同样需系统库

策略：
1. 尝试 `npx playwright install chromium --with-deps`（可能失败）
2. 退而其次：尝试系统是否有其他无依赖浏览器（`firefox` / `webkit` / `wkhtmltopdf` / `cutycapt`）
3. 最终退路：使用 `wkhtmltoimage` 类工具或纯 Node + JSDOM + canvas 渲染（不实用）
4. **如果全部失败**：跳过截图，在最终回复中明确告知用户"环境受限无法截图，需在本地 iPhone 17 PWA 中验证"

### 修复 6：提交并推 main
- `git add index.html`
- `git commit -m "fix: 持仓卡片UI优化及iOS PWA底部空白修复"`
- `git checkout main`
- `git merge trae/solo-agent-HVYcEO --ff-only` （如果 trae 是 main 的直接后代，否则用 `--no-ff`）
- `git push origin main`

## 决策与假设

- **单文件修改**：index.html
- **不创建新文件**
- **不创建 PR**：直接合并到 main 后推送
- **截图工具选择**：Playwright → Firefox → 任意可用工具 → 跳过
- **git 用户**：用本地临时配置的 `oooohcan@users.noreply.github.com`

## 验证步骤

1. `grep -n "pnl-separator" index.html` 应返回 1 行
2. `grep -n "safe-area-inset-bottom" index.html` 应返回 3 行
3. `grep -n "asset-detail-category" index.html` 应返回 ≥2 行（CSS + HTML）
4. `grep -n "white-space: nowrap" index.html` 在 `.notes-warning` 和 `.asset-detail-code` 上下文中命中
5. `git log origin/main -1` 显示新 commit
6. 截图存在 `/tmp/ios17_pwa.png`（如可行）

## 完成定义

- [ ] 5 个修复代码全部应用
- [ ] 截图完成（若环境允许）
- [ ] commit 已 push 到 origin main
- [ ] 总结报告回复给用户
