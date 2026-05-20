const app = getApp();
const { convertToCny, computePnL } = require('../../miniprogram/utils/finance');
const { buildAssetDisplay } = require('../../miniprogram/utils/transactions');

Page({
  data: {
    accounts: [],
    assets: [],
    filteredAssets: [],
    accountTotals: {},
    activeAccountId: '',
    privacyMode: false,
    displayTotal: '0.00',
    displayPnL: '0.00',
    accountCount: 0,
    assetCount: 0,
    insightsCount: 0,
    concentrationWarning: '当前持仓集中度正常',
    latestInsightSummary: '暂无 AI 投研笔记'
  },

  onShow() {
    this.refreshData();
  },

  refreshData() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const settings = data.settings || app.globalData.settings;
    const accounts = data.accounts || [];
    const assets = data.assets || [];
    const activeAccountId = this.data.activeAccountId || (accounts[0] && accounts[0].id) || '';

    const filteredAssets = assets
      .filter((item) => item.account_id === activeAccountId)
      .map((item) => buildAssetDisplay(item, settings));
    const accountTotals = {};

    accounts.forEach((account) => {
      const total = assets
        .filter((item) => item.account_id === account.id)
        .reduce((sum, asset) => sum + convertToCny(asset.market_price * asset.total_shares, asset.currency, settings.exchangeRates), 0);
      accountTotals[account.id] = total.toFixed(2);
    });

    const totalAmount = Object.values(accountTotals).reduce((sum, value) => sum + Number(value), 0);
    const totalPnL = filteredAssets.reduce((sum, asset) => sum + computePnL(asset, settings.exchangeRates), 0);
    const insights = data.insights || [];

    const codes = assets.map((item) => item.code).filter(Boolean);
    const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
    const concentrationWarning = duplicates.length
      ? '检测到重复持仓标的，存在较高集中度风险'
      : '当前持仓集中度正常';

    this.setData({
      accounts,
      assets,
      filteredAssets,
      accountTotals,
      activeAccountId,
      privacyMode: settings.privacyMode,
      displayTotal: settings.privacyMode ? '****' : Number(totalAmount).toFixed(2),
      displayPnL: settings.privacyMode ? '****' : Number(totalPnL).toFixed(2),
      accountCount: accounts.length,
      assetCount: filteredAssets.length,
      insightsCount: insights.length,
      latestInsightSummary: insights[0] ? insights[0].summary : '暂无 AI 投研笔记',
      concentrationWarning
    });
  },

  togglePrivacy() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    data.settings = data.settings || {};
    data.settings.privacyMode = !data.settings.privacyMode;
    wx.setStorageSync('jinji-data', data);
    app.globalData = data;
    this.refreshData();
  },

  selectAccount(event) {
    const accountId = event.currentTarget.dataset.accountid;
    this.setData({ activeAccountId: accountId }, () => this.refreshData());
  },

  goToAssetAdd() {
    wx.navigateTo({ url: '/pages/asset-add/asset-add' });
  },

  goToInsights() {
    wx.navigateTo({ url: '/pages/insights/insights' });
  }
});
