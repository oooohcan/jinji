# JinJI 极简资产管理微信小程序

## 目标
开发一款“输入极简，逻辑深刻，界面克制”的私人投研助手小程序。

## 目录结构
- `app.json` / `app.js` / `app.wxss`: 小程序全局配置与样式
- `pages/home`: 首页看板，支持隐私模式、总资产展示、账户卡片滑动
- `pages/asset-add`: 资产新增表单，支持手动录入和截图识别预览
- `pages/asset-detail`: 资产详情 + 交易记录与关联笔记展示
- `pages/transactions`: 交易录入页，支持买入/卖出/分红再投资/现金分红
- `pages/account`: 账户管理、切换与新增逻辑
- `pages/insights`: AI 投研笔记分析与自动标签
- `cloudfunctions/aiAnalyze`: AI 分析云函数入口
- `miniprogram/utils`: 金融计算与存储工具

## 初始实现功能
1. 首页看板：总资产、今日估算盈亏，隐私金额模糊显示
2. 资产新增：手动输入 + OCR 识别预览抽屉
3. 多账户管理：账户独立统计，支持新增账户
4. AI 分析：文本链接摘要提取、行业/情绪标签与冲突提醒

## 说明
- 当前版本使用本地 `wx.getStorageSync` 存储，已预留 `wx.cloud.callFunction` 调用逻辑
- 你后续可继续扩展 `asset_type`、`transaction`、`insights` 关联逻辑和实际汇率接口
- 已考虑异常处理：空字段提醒、AI 服务不可用降级、本地存储失败保护

## 启动
使用微信开发者工具打开此目录即可预览。如需云开发，请在 `app.js` 中填入正确云环境 ID。
