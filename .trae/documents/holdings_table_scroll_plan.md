# 持仓列表页横向滚动优化

## 需求
持仓列表页（6 列网格）在 iPhone 16 Pro（402px 宽度）上显示拥挤，字段被压缩。需要将表格改为横向滚动，让未显示的字段可以通过左右滑动查看。

## 现状分析

### 当前布局
- **容器**：`#assetList`，`margin: 0 16px`，`overflow:hidden`
- **表头**：`.asset-list-header`，6 列网格 `2fr 0.85fr 1.05fr 1.05fr 1.25fr 1.5fr`
- **数据行**：`.asset-item`，同样 6 列网格
- **响应式**：`@media (max-width:380px)` 时列宽更窄 `1.6fr 0.7fr 0.9fr 0.9fr 1fr 1.2fr`

### 问题
- 6 列在 370px 可用宽度（402-32）上每列平均 61px，太拥挤
- `overflow:hidden` 阻止了横向滚动
- 没有设置最小宽度，列被无限压缩

## 修改方案

### 步骤 1：包裹容器添加横向滚动
在 `#assetList` 外层添加一个滚动容器，或修改 `#assetList` 本身：
- `overflow-x: auto`
- `overflow-y: hidden`
- `-webkit-overflow-scrolling: touch`（iOS 平滑滚动）
- `scrollbar-width: none`（隐藏滚动条）

### 步骤 2：设置表格最小宽度
给 `.asset-list-header` 和 `.asset-item` 设置 `min-width`：
- 建议 `min-width: 420px`（保证每列至少 70px）
- 或使用 `width: max-content` 让内容决定宽度

### 步骤 3：调整列宽比例（可选）
保持现有比例，但确保在小屏幕上不会过度压缩：
- 表头和数据行使用相同的 `min-width`

### 步骤 4：隐藏滚动条但保留功能
```css
#assetList::-webkit-scrollbar { display: none; }
#assetList { -ms-overflow-style: none; scrollbar-width: none; }
```

## 涉及文件
- `/workspace/index.html`（唯一文件）

## 具体 CSS 修改位置
1. `#assetList`（约 L554-L562）：添加 `overflow-x: auto`，移除 `overflow:hidden`
2. `.asset-list-header`（约 L534-L550）：添加 `min-width: 420px`
3. `.asset-item`（约 L563-L575）：添加 `min-width: 420px`

## 验证
- 浏览器截图验证横向滚动是否生效
- 确认滚动条隐藏但功能正常
- 确认列宽不再过度压缩
