const { buildAssetDisplay } = require('../../miniprogram/utils/transactions');
const { convertToCny } = require('../../miniprogram/utils/finance');
const app = getApp();

const typeLabels = {
  BUY: '买入',
  SELL: '卖出',
  DIVIDEND_REINVEST: '分红再投',
  DIVIDEND_CASH: '现金分红'
};

Page({
  data: {
    asset: {},
    displayAsset: {},
    assetTransactions: []
  },

  onLoad(options) {
    this.assetId = options.id || '';
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const settings = data.settings || {};
    const asset = (data.assets || []).find((item) => item.id === this.assetId);

    if (!asset) {
      wx.showToast({ title: '资产不存在', icon: 'none' });
      wx.navigateBack();
      return;
    }

    const displayAsset = buildAssetDisplay(asset, settings);
    const transactions = (data.transactions || [])
      .filter((item) => item.asset_id === this.assetId)
      .reverse()
      .map((item) => ({
        ...item,
        typeLabel: typeLabels[item.type] || item.type,
        date: item.date || new Date(item.timestamp).toISOString().split('T')[0]
      }));

    this.setData({
      asset: Object.assign({}, asset, { dividend_handling: asset.dividend_handling || 'REINVEST' }),
      displayAsset,
      assetTransactions: transactions
    });
  },

  setDividendHandling(event) {
    const method = event.currentTarget.dataset.method;
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const asset = data.assets.find((a) => a.id === this.assetId);

    if (asset) {
      asset.dividend_handling = method;
      data.assets = data.assets.map((a) => (a.id === this.assetId ? asset : a));
      wx.setStorageSync('jinji-data', data);
      app.globalData = data;
      this.setData({ ['asset.dividend_handling']: method });
      wx.showToast({ title: `分红核算方式已改为${method === 'REINVEST' ? '再投资' : '现金分红'}`, icon: 'success' });
    }
  },

  addTransaction() {
    wx.navigateTo({
      url: `/pages/add-transaction/add-transaction?assetId=${this.assetId}`
    });
  },

  deleteAsset() {
    wx.showModal({
      title: '确认删除',
      content: '删除资产后，相关交易记录也会被删除，此操作不可撤销。',
      confirmColor: '#A44A3F',
      success: (res) => {
        if (res.confirm) {
          const data = wx.getStorageSync('jinji-data') || app.globalData;
          data.assets = (data.assets || []).filter((a) => a.id !== this.assetId);
          data.transactions = (data.transactions || []).filter((t) => t.asset_id !== this.assetId);
          wx.setStorageSync('jinji-data', data);
          app.globalData = data;
          wx.showToast({ title: '资产已删除', icon: 'success' });
          wx.navigateBack();
        }
      }
    });
  }
});
