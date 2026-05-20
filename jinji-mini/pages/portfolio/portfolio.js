const app = getApp();
const { convertToCny, computePnL } = require('../../miniprogram/utils/finance');
const { buildAssetDisplay } = require('../../miniprogram/utils/transactions');

Page({
  data: {
    accounts: [],
    assets: [],
    displayAssets: [],
    activeAccountId: 'all',
    privacyMode: false,
    totalAsset: '0.00',
    todayPnL: '0.00',
    todayPnLPercent: '0.00',
    todayPnLClass: 'neutral',
    sortBy: 'marketValue'
  },

  onShow() {
    this.loadPortfolio();
  },

  loadPortfolio() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const settings = data.settings || {};
    const accounts = data.accounts || [];
    const assets = data.assets || [];

    const displayAssets = this.getFilteredAndSortedAssets(assets, settings, this.data.activeAccountId, this.data.sortBy);
    const totalAsset = displayAssets.reduce((sum, asset) => sum + Number(asset.marketValue), 0).toFixed(2);
    const todayPnL = displayAssets.reduce((sum, asset) => sum + Number(asset.gainLoss), 0).toFixed(2);
    const todayPnLPercent = totalAsset > 0 ? ((todayPnL / totalAsset) * 100).toFixed(2) : '0.00';
    const todayPnLClass = todayPnL >= 0 ? 'positive' : 'negative';

    this.setData({
      accounts,
      assets,
      displayAssets,
      privacyMode: settings.privacyMode,
      totalAsset: settings.privacyMode ? '****' : totalAsset,
      todayPnL: settings.privacyMode ? '****' : todayPnL,
      todayPnLPercent: settings.privacyMode ? '****' : todayPnLPercent,
      todayPnLClass
    });
  },

  getFilteredAndSortedAssets(assets, settings, accountId, sortBy) {
    let filtered = assets.map((asset) => {
      const display = buildAssetDisplay(asset, settings);
      const gainLoss = (Number(display.marketValue) - Number(display.costValue)).toFixed(2);
      const gainLossPercent = Number(display.costValue) > 0 ? ((gainLoss / Number(display.costValue)) * 100).toFixed(2) : '0.00';
      const pnlClass = gainLoss >= 0 ? 'positive' : 'negative';
      return {
        ...display,
        gainLoss,
        gainLossPercent,
        pnlClass
      };
    });

    if (accountId !== 'all') {
      filtered = filtered.filter((item) => item.account_id === accountId);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'marketValue':
          return Number(b.marketValue) - Number(a.marketValue);
        case 'gainLoss':
          return Number(b.gainLoss) - Number(a.gainLoss);
        case 'gainLossPercent':
          return Number(b.gainLossPercent) - Number(a.gainLossPercent);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  },

  togglePrivacy() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    data.settings = data.settings || {};
    data.settings.privacyMode = !data.settings.privacyMode;
    wx.setStorageSync('jinji-data', data);
    app.globalData = data;
    this.loadPortfolio();
  },

  selectAccount(event) {
    const accountId = event.currentTarget.dataset.accountid;
    this.setData({ activeAccountId: accountId }, () => this.loadPortfolio());
  },

  setSortBy(event) {
    const sortBy = event.currentTarget.dataset.sortby;
    this.setData({ sortBy }, () => this.loadPortfolio());
  }
});
