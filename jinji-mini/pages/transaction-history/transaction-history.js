const app = getApp();

const typeLabels = {
  BUY: '买入',
  SELL: '卖出',
  DIVIDEND_REINVEST: '分红再投',
  DIVIDEND_CASH: '现金分红'
};

Page({
  data: {
    assets: [],
    transactions: [],
    groupedTransactions: [],
    filterAssetId: 'all'
  },

  onLoad() {
    this.loadTransactionHistory();
  },

  onShow() {
    this.loadTransactionHistory();
  },

  loadTransactionHistory() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const assets = data.assets || [];
    const transactions = (data.transactions || []).slice().reverse();

    this.setData({ assets, transactions });
    this.groupAndFilterTransactions();
  },

  groupAndFilterTransactions() {
    const { transactions, filterAssetId } = this.data;

    let filtered = transactions;
    if (filterAssetId !== 'all') {
      filtered = transactions.filter((txn) => txn.asset_id === filterAssetId);
    }

    const grouped = {};
    filtered.forEach((txn) => {
      const date = txn.date || new Date(txn.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(Object.assign({}, txn, { typeLabel: typeLabels[txn.type] || txn.type }));
    });

    const groupedArray = Object.keys(grouped)
      .sort()
      .reverse()
      .map((date) => ({ date, transactions: grouped[date] }));

    this.setData({ groupedTransactions: groupedArray });
  },

  filterAsset(event) {
    const assetId = event.currentTarget.dataset.assetid;
    this.setData({ filterAssetId: assetId });
    this.groupAndFilterTransactions();
  },

  undoTransaction(event) {
    const txnId = event.currentTarget.dataset.txnid;
    const txn = this.data.transactions.find((t) => t.id === txnId);

    if (!txn) {
      wx.showToast({ title: '交易不存在', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认撤销',
      content: '撤销此交易后，资产份额和成本基数将重新计算。',
      success: (res) => {
        if (res.confirm) {
          this.performUndo(txnId, txn);
        }
      }
    });
  },

  performUndo(txnId, txn) {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const assets = data.assets || [];
    const asset = assets.find((a) => a.id === txn.asset_id);

    if (!asset) {
      wx.showToast({ title: '关联资产不存在', icon: 'none' });
      return;
    }

    // 反向应用交易：减去购入变为卖出，加回卖出
    const reverseType = txn.type === 'BUY' ? 'SELL' : txn.type === 'SELL' ? 'BUY' : txn.type;
    const reverseTxn = Object.assign({}, txn, { type: reverseType });

    const { applyTransactionToAsset } = require('../../miniprogram/utils/transactions');
    applyTransactionToAsset(asset, {
      type: reverseType,
      shares: txn.shares,
      unit_price: txn.unit_price,
      amount: txn.amount,
      market_price: asset.market_price
    });

    data.transactions = (data.transactions || []).filter((t) => t.id !== txnId);
    data.assets = assets.map((a) => (a.id === asset.id ? asset : a));
    wx.setStorageSync('jinji-data', data);
    app.globalData = data;

    wx.showToast({ title: '交易已撤销', icon: 'success' });
    this.loadTransactionHistory();
  }
});
