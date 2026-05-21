# JinJI 极简资产管理小程序 - Code Wiki

## 项目概述

JinJI 是一款专注于个人资产管理的微信小程序，以"输入极简，逻辑深刻，界面克制"为设计理念，提供资产录入、交易管理、AI投研分析和多账户支持等功能。

---

## 目录结构

```
jinji-mini/
├── app.js                    # 小程序全局入口
├── app.json                  # 小程序全局配置
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置文件
├── cloudfunctions/            # 云函数目录
│   └── aiAnalyze/            # AI分析云函数
│       └── index.js
├── miniprogram/              # 工具模块目录
│   └── utils/                # 工具函数
│       ├── finance.js        # 金融计算工具
│       ├── transactions.js   # 交易处理工具
│       └── storage.js        # 存储工具
└── pages/                    # 页面目录
    ├── account/              # 账户管理页面
    ├── add-transaction/       # 新增交易页面
    ├── asset-add/             # 资产新增页面
    ├── asset-detail/          # 资产详情页面
    ├── insights/              # AI投研笔记页面
    ├── me/                    # 个人中心页面
    ├── portfolio/             # 持仓概览页面
    ├── transaction-history/   # 交易历史页面
    └── transactions/           # 交易录入页面
```

---

## 全局架构

### 数据模型

#### App 全局数据 (`app.globalData`)

```javascript
{
  accounts: [          // 账户列表
    {
      id: string,       // 账户唯一标识
      name: string,     // 账户名称
      type: string,     // 账户类型: pension/trading/bank/custom
      hidden: boolean   // 是否隐藏
    }
  ],
  assets: [             // 资产列表
    {
      id: string,                    // 资产唯一标识
      name: string,                  // 资产名称
      code: string,                  // 资产代码
      asset_type: string,            // 资产类型: A/HK/US/FUND/BANK/DEPOSIT/GOLD
      currency: string,               // 币种: CNY/USD/HKD/EUR
      total_shares: number,          // 持有份额
      cost_basis: number,             // 成本单价
      market_price: number,           // 当前市价
      account_id: string,             // 所属账户ID
      dividend_handling: string,     // 分红处理方式: REINVEST/CASH
      created_at: string              // 创建时间
    }
  ],
  transactions: [       // 交易记录列表
    {
      id: string,       // 交易唯一标识
      asset_id: string, // 关联资产ID
      account_id: string,// 关联账户ID
      type: string,     // 交易类型: BUY/SELL/DIVIDEND_REINVEST/DIVIDEND_CASH
      shares: number,   // 交易份额
      unit_price: number,// 单价
      amount: number,    // 总金额
      note: string,     // 备注
      insight_id: string,// 关联投研笔记ID
      created_at: string // 创建时间
    }
  ],
  insights: [           // 投研笔记列表
    {
      id: string,       // 笔记唯一标识
      text: string,     // 原始文本
      summary: string,  // AI摘要
      direction: string,// 方向: 看多/看空/中性
      industry: string, // 行业标签
      tags: string[],   // 关键词标签
      warning: string,  // 冲突警告
      created_at: string// 创建日期
    }
  ],
  settings: {            // 全局设置
    privacyMode: boolean,       // 隐私模式
    baseCurrency: string,       // 基准货币
    exchangeRates: {            // 汇率配置
      USD: number,
      HKD: number,
      EUR: number
    }
  }
}
```

### 页面路由配置

| 页面路径 | 页面名称 | TabBar位置 |
|---------|---------|-----------|
| pages/portfolio/portfolio | 持仓概览 | 持仓 |
| pages/add-transaction/add-transaction | 新增交易 | 新增 |
| pages/insights/insights | AI投研笔记 | 笔记 |
| pages/me/me | 个人中心 | 我的 |
| pages/account/account | 账户管理 | - |
| pages/asset-add/asset-add | 资产新增 | - |
| pages/asset-detail/asset-detail | 资产详情 | - |
| pages/transaction-history/transaction-history | 交易历史 | - |
| pages/transactions/transactions | 交易录入 | - |

---

## 核心模块详解

### 1. App 全局模块 (`app.js`)

**文件路径**: `/workspace/jinji-mini/app.js`

**核心职责**:
- 初始化微信云开发环境
- 管理全局数据 `globalData`
- 提供数据持久化方法 `saveGlobalData()`

**关键方法**:

| 方法名 | 参数 | 返回值 | 说明 |
|-------|-----|-------|------|
| `onLaunch()` | - | void | 小程序启动时执行，初始化云环境和默认数据 |
| `saveGlobalData()` | - | void | 保存全局数据到本地存储 |

**依赖关系**: 无外部依赖，直接使用 `wx.getStorageSync` 和 `wx.setStorageSync`

---

### 2. 金融计算工具 (`miniprogram/utils/finance.js`)

**文件路径**: `/workspace/jinji-mini/miniprogram/utils/finance.js`

**核心职责**: 提供货币转换、金额格式化、盈亏计算等金融相关计算

**关键函数**:

| 函数名 | 参数 | 返回值 | 说明 |
|-------|-----|-------|------|
| `convertToCny(value, currency, rates)` | value: number, currency: string, rates: object | number | 将任意币种转换为人民币 |
| `formatAmount(value, privacyMode)` | value: number, privacyMode: boolean | string | 格式化金额，隐私模式下返回 '****' |
| `computePnL(asset, rates)` | asset: object, rates: object | number | 计算资产盈亏（浮动盈亏） |

**使用示例**:
```javascript
const { convertToCny, formatAmount, computePnL } = require('../../miniprogram/utils/finance');

// 美元转人民币
const cnyValue = convertToCny(100, 'USD', { USD: 7.2 }); // 720

// 格式化金额
const display = formatAmount(1234.56, false); // "1234.56"

// 计算盈亏
const pnl = computePnL(asset, { USD: 7.2 });
```

---

### 3. 交易处理工具 (`miniprogram/utils/transactions.js`)

**文件路径**: `/workspace/jinji-mini/miniprogram/utils/transactions.js`

**核心职责**: 处理各类交易操作，包括买入、卖出、分红再投资、现金分红等

**关键函数**:

| 函数名 | 参数 | 返回值 | 说明 |
|-------|-----|-------|------|
| `applyTransactionToAsset(asset, transaction)` | asset: object, transaction: object | object | 将交易应用到资产，更新资产持仓和成本 |
| `createTransactionRecord(params)` | params: object | object | 创建交易记录对象 |
| `buildAssetDisplay(asset, settings)` | asset: object, settings: object | object | 构建用于显示的资产数据 |

**交易类型处理逻辑**:

| 类型 | 处理逻辑 |
|-----|---------|
| `BUY` | 新增份额，计算加权平均成本 |
| `SELL` | 减少份额，成本不变，更新市价 |
| `DIVIDEND_REINVEST` | 分红金额按当前市价折算为份额，增加持仓 |
| `DIVIDEND_CASH` | 分红金额从成本基数中扣除 |

**成本计算公式**:
- 买入加权平均成本: `新成本 = (原成本 × 原份额 + 买入金额) / 新份额`
- 现金分红成本调整: `新成本 = (原成本 × 原份额 - 分红金额) / 原份额`

---

### 4. 存储工具 (`miniprogram/utils/storage.js`)

**文件路径**: `/workspace/jinji-mini/miniprogram/utils/storage.js`

**核心职责**: 封装本地存储操作，提供数据加载和保存的统一接口

**关键函数**:

| 函数名 | 参数 | 返回值 | 说明 |
|-------|-----|-------|------|
| `loadData()` | - | object/null | 从本地存储加载数据，已初始化才返回 |
| `saveData(data)` | data: object | boolean | 保存数据到本地存储，失败返回false |

**存储键**: `jinji-data`

---

### 5. 持仓概览页面 (`pages/portfolio/portfolio.js`)

**文件路径**: `/workspace/jinji-mini/pages/portfolio/portfolio.js`

**核心职责**: 展示用户所有资产的持仓概览，包括总资产、今日盈亏统计

**页面数据**:
```javascript
{
  accounts: [],              // 账户列表
  assets: [],               // 资产列表
  displayAssets: [],        // 用于显示的资产列表
  activeAccountId: string,  // 当前选中的账户ID，'all'表示全部
  privacyMode: boolean,     // 隐私模式
  totalAsset: string,       // 总资产（格式化）
  todayPnL: string,         // 今日盈亏
  todayPnLPercent: string,  // 盈亏百分比
  sortBy: string            // 排序字段
}
```

**关键方法**:

| 方法名 | 参数 | 说明 |
|-------|-----|------|
| `onShow()` | - | 页面显示时刷新数据 |
| `loadPortfolio()` | - | 加载并计算持仓数据 |
| `getFilteredAndSortedAssets(assets, settings, accountId, sortBy)` | 资产列表、设置、账户ID、排序字段 | 过滤和排序资产 |
| `togglePrivacy()` | - | 切换隐私模式 |
| `selectAccount(event)` | 事件对象 | 切换账户筛选 |
| `setSortBy(event)` | 事件对象 | 设置排序方式 |

**排序方式**:
- `marketValue`: 按市值降序
- `gainLoss`: 按盈亏金额降序
- `gainLossPercent`: 按盈亏百分比降序
- `name`: 按名称字母排序

---

### 6. 新增交易页面 (`pages/add-transaction/add-transaction.js`)

**文件路径**: `/workspace/jinji-mini/pages/add-transaction/add-transaction.js`

**核心职责**: 快速录入新的交易记录

**支持的交易类型**:
| 类型 | 代码 | 必填字段 |
|-----|-----|---------|
| 买入 | `BUY` | 份额、单价 |
| 卖出 | `SELL` | 份额、单价 |
| 分红再投资 | `DIVIDEND_REINVEST` | 金额 |
| 现金分红 | `DIVIDEND_CASH` | 金额 |

**关键方法**:

| 方法名 | 说明 |
|-------|------|
| `onAssetChange(event)` | 处理资产选择变更 |
| `selectType(event)` | 选择交易类型 |
| `onInputChange(event)` | 处理表单输入变更 |
| `selectImage()` | 从相册选择图片 |
| `takePhoto()` | 拍照识别 |
| `recognizeTransactionFromImage(filePath)` | 模拟OCR识别交易（预留接口） |
| `saveTransaction()` | 保存交易记录 |
| `resetForm()` | 重置表单 |

---

### 7. AI投研笔记页面 (`pages/insights/insights.js`)

**文件路径**: `/workspace/jinji-mini/pages/insights/insights.js`

**核心职责**: 提供AI文本分析功能，自动提取摘要、行业标签、情绪标签

**分析结果字段**:
| 字段 | 说明 |
|-----|------|
| `summary` | AI生成的摘要 |
| `direction` | 观点倾向：看多/看空/中性 |
| `industry` | 行业标签：半导体/消费/金融/医药/多行业 |
| `tags` | 关键词标签数组 |
| `warning` | 逻辑冲突警告（如同时出现"卖出"和"看多"） |

**关键词匹配规则**:
| 关键词 | 匹配内容 | 标签 |
|-------|---------|------|
| 买入/看多 | `direction = '看多'` | - |
| 卖出/看空 | `direction = '看空'` | - |
| 半导体 | `industry = '半导体'` | - |
| 消费 | `industry = '消费'` | - |
| 金融 | `industry = '金融'` | - |
| 医药 | `industry = '医药'` | - |
| 分红/现金流 | - | `现金流` |
| 成长/扩张 | - | `成长` |
| 估值/风险 | - | `风险` |
| 技术面/图表 | - | `技术面` |

---

### 8. 账户管理页面 (`pages/account/account.js`)

**文件路径**: `/workspace/jinji-mini/pages/account/account.js`

**核心职责**: 管理多个账户，支持新增账户

**默认账户类型**:
| 类型代码 | 账户名称 |
|---------|---------|
| `pension` | 养老金账户 |
| `trading` | 激进短线账户 |
| `bank` | 招行账户 |
| `custom` | 自定义账户 |

---

### 9. 资产新增页面 (`pages/asset-add/asset-add.js`)

**文件路径**: `/workspace/jinji-mini/pages/asset-add/asset-add.js`

**核心职责**: 添加新资产，支持手动输入和OCR批量识别

**支持的资产类型**:
| 类型索引 | 类型名称 | 资产代码 | 默认币种 |
|---------|---------|---------|---------|
| 0 | 股票（A） | `A` | CNY |
| 1 | 股票（港） | `HK` | HKD |
| 2 | 股票（美） | `US` | USD |
| 3 | 场外基金 | `FUND` | CNY |
| 4 | 银行理财 | `BANK` | CNY |
| 5 | 固定存款 | `DEPOSIT` | CNY |
| 6 | 黄金 | `GOLD` | CNY |

**关键方法**:
| 方法名 | 说明 |
|-------|------|
| `selectImage()` | 从相册选择图片进行OCR识别 |
| `takePhoto()` | 拍照识别 |
| `recognizeAssetsFromImage(filePath)` | 模拟OCR识别资产（预留接口） |
| `saveBatchAssets()` | 批量保存OCR识别的资产 |
| `saveAsset()` | 保存单个手动输入的资产 |

---

### 10. 资产详情页面 (`pages/asset-detail/asset-detail.js`)

**文件路径**: `/workspace/jinji-mini/pages/asset-detail/asset-detail.js`

**核心职责**: 展示单个资产的详细信息和关联的交易记录

**关键方法**:
| 方法名 | 说明 |
|-------|------|
| `refresh()` | 刷新资产和交易数据 |
| `setDividendHandling(event)` | 设置分红核算方式（再投资/现金） |
| `addTransaction()` | 跳转至交易录入页面 |
| `deleteAsset()` | 删除资产及关联交易 |

---

### 11. 交易历史页面 (`pages/transaction-history/transaction-history.js`)

**文件路径**: `/workspace/jinji-mini/pages/transaction-history/transaction-history.js`

**核心职责**: 展示交易历史记录，支持按资产筛选和撤销交易

**关键方法**:
| 方法名 | 说明 |
|-------|------|
| `loadTransactionHistory()` | 加载交易历史数据 |
| `groupAndFilterTransactions()` | 按日期分组和筛选交易 |
| `filterAsset(event)` | 按资产筛选交易 |
| `undoTransaction(event)` | 显示撤销确认对话框 |
| `performUndo(txnId, txn)` | 执行交易撤销 |

**撤销逻辑**:
- 买入撤销：反向卖出
- 卖出撤销：反向买入
- 分红撤销：保持类型不变，调整金额

---

### 12. 个人中心页面 (`pages/me/me.js`)

**文件路径**: `/workspace/jinji-mini/pages/me/me.js`

**核心职责**: 提供用户设置、数据统计和数据管理功能

**关键方法**:
| 方法名 | 说明 |
|-------|------|
| `refreshStats()` | 刷新统计数据 |
| `togglePrivacy(event)` | 切换隐私模式 |
| `onCurrencyChange(event)` | 切换基准货币 |
| `clearData()` | 清空所有数据 |

---

### 13. AI分析云函数 (`cloudfunctions/aiAnalyze/index.js`)

**文件路径**: `/workspace/jinji-mini/cloudfunctions/aiAnalyze/index.js`

**核心职责**: 服务端AI文本分析（预留）

**入参**:
```javascript
{
  text: string  // 待分析的文本内容
}
```

**返回**:
```javascript
{
  summary: string,    // 分析摘要
  direction: string,   // 方向
  industry: string,    // 行业
  tags: string[],      // 标签
  warning: string      // 警告信息
}
```

---

## 依赖关系图

```
app.js (全局入口)
├── globalData (全局数据)
│   ├── accounts[]
│   ├── assets[]
│   ├── transactions[]
│   ├── insights[]
│   └── settings{}
│
├── pages/
│   ├── portfolio/
│   │   └── portfolio.js
│   │       └── utils/finance.js (convertToCny, computePnL)
│   │       └── utils/transactions.js (buildAssetDisplay)
│   │
│   ├── add-transaction/
│   │   └── add-transaction.js
│   │       └── utils/transactions.js (applyTransactionToAsset, createTransactionRecord)
│   │
│   ├── transactions/
│   │   └── transactions.js
│   │       └── utils/transactions.js
│   │
│   ├── asset-add/
│   │   └── asset-add.js
│   │
│   ├── asset-detail/
│   │   └── asset-detail.js
│   │       └── utils/transactions.js (buildAssetDisplay)
│   │       └── utils/finance.js (convertToCny)
│   │
│   ├── transaction-history/
│   │   └── transaction-history.js
│   │       └── utils/transactions.js (applyTransactionToAsset)
│   │
│   ├── insights/
│   │   └── insights.js
│   │
│   ├── account/
│   │   └── account.js
│   │
│   └── me/
│       └── me.js
│
└── cloudfunctions/
    └── aiAnalyze/ (预留AI分析能力)
```

---

## 配置文件

### app.json

```json
{
  "pages": [...],           // 页面路由配置
  "window": {
    "navigationBarTitleText": "JinJI",
    "navigationBarBackgroundColor": "#F7F4EE",
    "backgroundColor": "#F7F4EE"
  },
  "tabBar": {
    "color": "#9E9E9E",
    "selectedColor": "#A44A3F",  // 主色调
    "backgroundColor": "#FFFFFF",
    "list": [
      { "pagePath": "pages/portfolio/portfolio", "text": "持仓" },
      { "pagePath": "pages/add-transaction/add-transaction", "text": "新增" },
      { "pagePath": "pages/insights/insights", "text": "笔记" },
      { "pagePath": "pages/me/me", "text": "我的" }
    ]
  },
  "cloud": true              // 启用云开发
}
```

---

## 运行方式

### 环境要求
- 微信开发者工具
- 微信小程序基础库 2.0+

### 启动步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd jinji-mini
   ```

2. **打开项目**
   - 启动微信开发者工具
   - 选择"导入项目"
   - 选择 `jinji-mini` 目录

3. **配置云开发**（可选）
   - 在 `app.js` 中填入正确的云环境 ID
   ```javascript
   wx.cloud.init({
     env: 'your-cloud-env-id',
     traceUser: true
   });
   ```

4. **运行预览**
   - 点击微信开发者工具的"编译"按钮
   - 选择模拟器或真机预览

---

## 设计规范

### 色彩系统

| 用途 | 色值 | 说明 |
|-----|------|------|
| 主色调 | `#A44A3F` | 品牌色，用于TabBar选中态、主要按钮 |
| 背景色 | `#F7F4EE` | 页面背景 |
| 卡片背景 | `#FFFFFF` | 卡片背景 |
| 文字主色 | `#222222` | 标题、重要文字 |
| 文字次色 | `#7D7D7D` | 辅助说明文字 |
| 输入框背景 | `#F5F2E9` | 表单输入框 |
| 正收益 | CSS类 `positive` | 盈利用红色 |
| 负收益 | CSS类 `negative` | 亏损用绿色 |

### 命名规范

| 类型 | 规范 | 示例 |
|-----|------|------|
| 页面目录 | 小写+连字符 | `asset-detail/` |
| JS文件 | 小写 | `asset-detail.js` |
| WXML文件 | 小写 | `asset-detail.wxml` |
|WXSS文件 | 小写 | `asset-detail.wxss` |
| 账户ID | `acc-{timestamp}` | `acc-1715000000000` |
| 资产ID | `asset-{timestamp}-{random}` | `asset-1715000000000-abc123` |
| 交易ID | `txn-{timestamp}-{random}` | `txn-1715000000000-123` |
| 笔记ID | `insight-{timestamp}` | `insight-1715000000000` |

---

## 注意事项

1. **数据存储**: 当前使用 `wx.getStorageSync` 本地存储，已预留云函数调用逻辑
2. **OCR功能**: `recognizeAssetsFromImage` 和 `recognizeTransactionFromImage` 为预留接口，当前为模拟实现
3. **汇率**: 默认汇率为静态配置 `USD: 7.2, HKD: 0.92, EUR: 7.9`，实际使用需对接实时汇率API
4. **AI分析**: 本地分析函数 `callAiAnalyze` 为简化实现，云函数 `aiAnalyze` 为预留扩展接口

---

## 扩展建议

1. **数据持久化**: 考虑接入微信云数据库，实现多设备同步
2. **实时行情**: 对接实时行情API，自动更新资产市价
3. **报表导出**: 支持导出月度/年度投资报告
4. **通知提醒**: 增加分红到账、价格提醒等功能
5. **多语言**: 国际化支持，适配不同地区用户
