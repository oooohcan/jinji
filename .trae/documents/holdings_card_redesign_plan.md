# 持仓卡片优化 & iOS PWA 布局修复方案

## 一、需求分析

用户提出三个需求：
1. **持仓卡片字段重设计**：调整单张持仓卡片概览的字段，包含资产名称、代码、资产类别、持仓天数、持仓量、股价/成本价、今日盈亏（率）、持仓盈亏（率）、最新价、市值等；理财/存款需显示到期日；并创造性补充必要字段
2. **iOS PWA 字段名行溢出修复**：安装为 PWA 后，持仓列表字段名行最右边突出/溢出
3. **底部标签栏空白修复**：底部标签栏下方有空白区域，需让标签栏贴底

## 二、现有代码研究结论

### 项目结构
- 主要文件：`/workspace/index.html`（单文件 PWA 应用，包含 HTML + CSS + JS）
- 另有 WeChat 小程序版本在 `/workspace/jinji-mini/`，但用户截图和描述针对 PWA，本次仅修改 `index.html`

### 当前持仓卡片布局（index.html L547-L651）
采用**卡片式两行布局**：
- **第一行** (`.asset-row-main`)：左侧资产名称+代码·类别，右侧最新价+今日盈亏
- **第二行** (`.asset-row-sub`)：4 列网格 —— 持仓量 | 成本价 | 市值 | 持仓盈亏
- 每个卡片内使用 `.sub-label` + `.sub-value` 的标签内嵌式设计，无需额外表头行
- `.asset-list-header { display:none; }` 已隐藏旧表格表头

### 现有 6 个示例资产
- 4 个标准资产（股票/基金）：贵州茅台、腾讯控股、易方达消费、苹果公司
- 2 个固收类资产（存款/理财）：一年期定期存款、招银理财·月开鑫
- 固收类已特殊处理：显示"本金"而非"持仓量"，"年化"代替成本价，副标题显示到期日

### iOS PWA 表头溢出问题分析
- 用户截图显示了一个**表格式字段名行**（资产 | 持仓量 | 成本价 | 现价 | 今日 | 持仓盈…），这是旧版表格布局的表头
- 当前代码中 `.asset-list-header` 已设为 `display:none`，但用户设备上可能因缓存或 CSS 优先级问题仍然显示
- 即使保持卡片式布局（无需额外表头），也需确保：
  - `#assetList` 容器不产生横向溢出
  - 所有子元素都在容器宽度内
  - `overflow-x: hidden` 在 iOS PWA 环境下正确生效

### 底部标签栏空白问题分析
- `.tab-bar` 使用 `position: fixed; bottom: 0; padding-bottom: var(--safe-bottom)` 
- `--safe-bottom: env(safe-area-inset-bottom, 0px)` 处理 iOS Home Indicator 区域
- `.page` 的 `bottom: calc(var(--tab-height) + var(--safe-bottom))` 预留标签栏空间
- **问题根因**：
  1. iOS PWA 中 `100vh` 计算不包含底部安全区域，需配合 `-webkit-fill-available`
  2. `.tab-bar` 缺少 `width: 100%` 显式声明（虽用 left:0;right:0，但在某些 PWA 环境可能异常）
  3. `.app-container` 的 `max-width: 430px; margin: 0 auto` 居中时，fixed 定位的 tab-bar 全屏宽度但容器居中，需确认对齐
  4. 需要给 `body`/`html` 也添加安全区域 padding 兜底

## 三、修改方案

### 任务 1：持仓卡片字段重设计

#### 新字段布局方案（三行卡片式布局）

在现有两行卡片基础上优化为更清晰的三区域布局：

**区域一：顶部信息行（资产标识 + 最新价 + 今日盈亏）**
- 左侧：
  - 资产名称（粗体大字）
  - 副标题：代码 · 资产类别 · 持仓天数（如 "600519 · 股票 · 持仓186天"）
- 右侧：
  - 最新价（粗体）
  - 今日盈亏：金额 + 收益率（红绿色标识）

**区域二：数据网格行（核心指标 4 列）**
| 持仓量 | 成本价 | 市值 | 持仓盈亏（金额+率） |

**区域三：底部信息行（辅助信息，仅在需要时显示）**
- 持仓占比（该资产市值占总资产百分比）
- 固收类（存款/理财）：到期日 + 距到期天数 + 年化收益率

#### 创造性补充字段
经思考，以下字段对投资者决策有实际价值：
1. **持仓占比（仓位）**：单个资产市值/总资产，帮助用户感知集中度风险
2. **持仓天数**：已有 `data-hold-days` 属性但未在卡片中展示，帮助评估持有期
3. **距到期天数**（固收类）：相比固定日期更直观，如"还剩188天到期"
4. **累计收益/利息**（固收类）：存款/理财的累计利息收入
5. **资产类别标签颜色区分**：股票/基金/存款/理财使用不同色调标签，提升辨识度

#### 固收类差异化展示
存款/理财类资产：
- 副标题：类别 · 到期日（如 "存款 · 2026-12-31到期（剩188天）"）
- 数据网格：本金 | 年化利率 | 市值（本息） | 累计收益
- 持仓占比同样显示

#### CSS 调整要点
- `.asset-row-sub` 网格保持 4 列但优化列宽比例
- 新增 `.asset-row-extra` 第三行用于持仓占比/到期信息
- 优化 `.col-name-sub` 显示更多信息（code · type · hold days）
- 固收类通过 `.asset-item-no-code` 类名区分字段标签

### 任务 2：iOS PWA 字段名行溢出修复

策略：**保持卡片式内嵌标签设计，不显示独立表头行**，从根本上消除溢出问题。

具体修复：
1. 确保 `.asset-list-header` 彻底隐藏（添加 `!important` 兜底，防止 iOS PWA 渲染异常）
2. `#assetList` 添加 `overflow-x: hidden` 防止任何横向溢出
3. `.asset-row-sub` 使用 `min-width: 0` 防止 grid 子项撑破容器
4. `.sub-value` 添加 `overflow: hidden; text-overflow: ellipsis` 防止长文本溢出
5. 检查并确保 `.holdings-toolbar` 和 `.filter-bar` 内的 chips 容器正确处理横向滚动（已有 `overflow-x: auto`）
6. 添加 `-webkit-transform: translateZ(0)` 触发 GPU 加速，修复 iOS 渲染问题

### 任务 3：底部标签栏贴底修复

修改 CSS 确保标签栏在 iOS PWA 下完全贴底：

1. **`:root` 变量增强**：
   - 添加 `--sat: env(safe-area-inset-top)` 和 `--sab: env(safe-area-inset-bottom)`
   - 使用 `@supports` 检测 `env()` 支持

2. **`html, body` 修复**：
   - 设置 `height: 100%; width: 100%`
   - 添加 `padding-bottom: constant(safe-area-inset-bottom);`（iOS 11.0-11.2 兼容）
   - 添加 `padding-bottom: env(safe-area-inset-bottom);`

3. **`.app-container` 修复**：
   - 改为 `height: 100%; height: 100vh; height: -webkit-fill-available; height: fill-available;`
   - 移除 `min-height` 重复，确保完全填充
   - 添加 `padding-bottom: 0;` 确保底部无多余空间

4. **`.tab-bar` 修复**：
   - 添加 `width: 100%`
   - 确保 `bottom: 0; padding-bottom: env(safe-area-inset-bottom);`
   - 添加 `-webkit-backdrop-filter` 兼容
   - 设置 `z-index` 确保在最顶层

5. **`.page` 修复**：
   - 底部偏移量确保与 tab-bar 高度精确匹配：`bottom: calc(var(--tab-height) + env(safe-area-inset-bottom, 0px))`
   - 添加 `padding-bottom: 0; margin-bottom: 0;`
   - 最后一个子元素添加适当 `padding-bottom` 避免内容被 tab-bar 遮挡

## 四、涉及文件

仅需修改一个文件：
- `/workspace/index.html`（CSS 样式 + HTML 结构 + 硬编码示例数据）

### 具体修改区域

| 修改区域 | 行号范围（约） | 修改内容 |
|---------|-------------|---------|
| CSS 变量 | L34-L38 | 增强 safe-area 变量和高度变量 |
| html/body 基础样式 | L40-L50 | 修复 iOS 高度和安全区域 |
| `.app-container` | L52-L61 | 修复高度填充 |
| `.page` | L63-L79 | 修复底部偏移 |
| `.tab-bar` | L87-L99 | 添加 width:100%，修复贴底 |
| `.asset-list-header` | L534-L536 | 加强隐藏，防止 iOS 显示 |
| `#assetList` | L538-L545 | 添加 overflow-x: hidden 和 iOS 渲染修复 |
| `.asset-item` | L547-L563 | 优化 padding 和布局 |
| `.col-name-sub` | L583-L589 | 支持显示代码·类别·持仓天数 |
| `.asset-row-sub` | L615-L643 | 优化列宽和子项溢出处理 |
| 新增 `.asset-row-extra` | 新增 | 第三行辅助信息（持仓占比、到期信息） |
| 新增 `.hold-days-badge` 等 | 新增 | 持仓天数标签样式 |
| 6个资产 HTML | L4166-L4347 | 更新硬编码资产数据，补充持仓天数/到期日/占比等 |

## 五、执行步骤

### Step 1：修复底部标签栏空白问题
- 修改 CSS 变量、html/body、app-container、page、tab-bar 样式
- 确保 iOS safe-area-inset-bottom 正确处理
- 添加 iOS 版本兼容前缀（constant → env）

### Step 2：修复 iOS PWA 字段名行溢出问题
- 确保 `.asset-list-header` 完全隐藏（display:none !important）
- 为 `#assetList` 及其子元素添加 overflow 防护
- 修复 grid 子项溢出问题

### Step 3：重设计持仓卡片字段
- 修改 `.col-name-sub` 格式为"代码 · 类别 · 持仓N天"
- 优化 `.asset-row-sub` 的 4 列布局和标签/数值样式
- 新增第三行 `.asset-row-extra` 用于持仓占比、到期信息
- 为固收类资产（deposit/wealth）定制字段标签和内容
- 添加持仓占比、距到期天数等新字段展示
- 更新 6 个硬编码资产项的 HTML 结构和数据

### Step 4：添加辅助样式
- 持仓天数小标签样式
- 持仓占比显示
- 到期日/距到期天数样式
- 资产类别色彩区分（可选增强）

### Step 5：验证
- 启动本地服务器，使用浏览器模拟器验证
- 检查所有卡片布局完整性
- 确认标签栏完全贴底无空白
- 确认无横向溢出

## 六、风险与注意事项

1. **硬编码数据**：当前资产数据为硬编码 HTML，修改需逐个更新 6 个资产项。添加新资产时需遵循新模板格式。
2. **iOS 版本兼容**：`env(safe-area-inset-bottom)` 需要 iOS 11.2+，`constant()` 语法用于 iOS 11.0-11.2 兼容，需同时添加两套声明。
3. **PWA 缓存**：修改后用户可能看到旧缓存版本，建议提醒用户清除缓存或重新添加到主屏。
4. **固收类字段差异**：存款/理财使用"本金/年化/累计收益"而非"持仓量/成本价/持仓盈亏"，通过 `.asset-item-no-code` 类区分处理。
5. **数据计算**：持仓占比 = 该资产市值 / 总资产市值，当前为硬编码展示值；持仓天数从 `data-hold-days` 读取；距到期天数需根据 `data-maturity` 计算（可在 JS 中实现或硬编码显示）。
