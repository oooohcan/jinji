App({
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: '',
        traceUser: true
      });
    }
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
        exchangeRates: {
          USD: 7.2,
          HKD: 0.92,
          EUR: 7.9
        }
      }
    };
    const stored = wx.getStorageSync('jinji-data');
    if (!stored || !stored.initialized) {
      wx.setStorageSync('jinji-data', Object.assign({ initialized: true }, defaultData));
      this.globalData = defaultData;
    } else {
      this.globalData = stored;
    }
  },
  saveGlobalData() {
    wx.setStorageSync('jinji-data', Object.assign({ initialized: true }, this.globalData));
  },
  globalData: {}
});
