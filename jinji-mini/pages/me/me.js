const app = getApp();

Page({
  data: {
    privacyMode: false,
    currencyOptions: ['CNY', 'USD', 'HKD', 'EUR'],
    selectedCurrencyIndex: 0,
    totalAssets: 0,
    totalTransactions: 0,
    totalInsights: 0
  },

  onShow() {
    this.refreshStats();
  },

  refreshStats() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const settings = data.settings || {};
    const assets = data.assets || [];
    const transactions = data.transactions || [];
    const insights = data.insights || [];

    const currencyIndex = this.data.currencyOptions.indexOf(settings.baseCurrency || 'CNY');

    this.setData({
      privacyMode: settings.privacyMode,
      totalAssets: assets.length,
      totalTransactions: transactions.length,
      totalInsights: insights.length,
      selectedCurrencyIndex: currencyIndex === -1 ? 0 : currencyIndex
    });
  },

  togglePrivacy(event) {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    data.settings = data.settings || {};
    data.settings.privacyMode = event.detail;
    wx.setStorageSync('jinji-data', data);
    app.globalData = data;
    this.refreshStats();
  },

  onCurrencyChange(event) {
    const index = event.detail.value;
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    data.settings = data.settings || {};
    data.settings.baseCurrency = this.data.currencyOptions[index];
    wx.setStorageSync('jinji-data', data);
    app.globalData = data;
    this.refreshStats();
  },

  clearData() {
    wx.showModal({
      title: '确认清空',
      content: '将清空所有资产、交易和笔记数据，此操作不可恢复',
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const defaultData = {
            accounts: [
              { id: 'acc-1', name: '养老金账户', type: 'pension', hidden: false },
              { id: 'acc-2', name: '激进短线账户', type: 'trading', hidden: false },
              { id: 'acc-3', name: '招行账户', type: 'bank', hidden: false }
            ],
            assets: [],
            transactions: [],
            insights: [],
            settings: {
              privacyMode: false,
              baseCurrency: 'CNY',
              exchangeRates: { USD: 7.2, HKD: 0.92, EUR: 7.9 }
            }
          };
          wx.setStorageSync('jinji-data', Object.assign({ initialized: true }, defaultData));
          app.globalData = defaultData;
          wx.showToast({ title: '数据已清空', icon: 'success' });
          this.refreshStats();
        }
      }
    });
  }
});
