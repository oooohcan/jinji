const app = getApp();
const { applyTransactionToAsset, createTransactionRecord } = require('../../miniprogram/utils/transactions');

Page({
  data: {
    assetOptions: [],
    assets: [],
    selectedAssetIndex: 0,
    transactionTypes: ['买入', '卖出', '分红再投资', '现金分红'],
    transactionTypeMap: ['BUY', 'SELL', 'DIVIDEND_REINVEST', 'DIVIDEND_CASH'],
    selectedTypeIndex: 0,
    showShareFields: true,
    showPriceFields: true,
    showAmountField: false,
    form: {
      asset_id: '',
      shares: '',
      unit_price: '',
      amount: '',
      note: ''
    }
  },

  onLoad(options) {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const assets = data.assets || [];
    const assetOptions = assets.map((item) => `${item.name} (${item.code})`);
    const initialIndex = assets.findIndex((asset) => asset.id === options.assetId);
    const selectedAssetIndex = initialIndex === -1 ? 0 : initialIndex;
    const form = Object.assign({}, this.data.form, { asset_id: assets[selectedAssetIndex] && assets[selectedAssetIndex].id });

    this.setData({
      assets,
      assetOptions,
      selectedAssetIndex,
      form
    });

    if (options.assetId && initialIndex === -1) {
      wx.showToast({ title: '未找到指定资产', icon: 'none' });
    }
  },

  onAssetChange(event) {
    const index = event.detail.value;
    const asset = this.data.assets[index];
    this.setData({ selectedAssetIndex: index, form: Object.assign({}, this.data.form, { asset_id: asset.id }) });
  },

  onTypeChange(event) {
    const index = event.detail.value;
    const type = this.data.transactionTypeMap[index];
    this.setData({
      selectedTypeIndex: index,
      showShareFields: type === 'BUY' || type === 'SELL',
      showPriceFields: type === 'BUY' || type === 'SELL',
      showAmountField: type === 'DIVIDEND_REINVEST' || type === 'DIVIDEND_CASH',
      form: Object.assign({}, this.data.form, { shares: '', unit_price: '', amount: '' })
    });
  },

  onInputChange(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;
    this.setData({ ['form.' + field]: value });
  },

  getTransactionType() {
    return this.data.transactionTypeMap[this.data.selectedTypeIndex];
  },

  resetForm() {
    this.setData({ form: { asset_id: this.data.form.asset_id, shares: '', unit_price: '', amount: '', note: '' } });
  },

  saveTransaction() {
    const type = this.getTransactionType();
    const form = this.data.form;
    if (!form.asset_id) {
      wx.showToast({ title: '请选择资产', icon: 'none' });
      return;
    }
    if ((type === 'BUY' || type === 'SELL') && (!form.shares || !form.unit_price)) {
      wx.showToast({ title: '请输入份额和价格', icon: 'none' });
      return;
    }
    if ((type === 'DIVIDEND_REINVEST' || type === 'DIVIDEND_CASH') && !form.amount) {
      wx.showToast({ title: '请输入分红金额', icon: 'none' });
      return;
    }

    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const asset = (data.assets || []).find((item) => item.id === form.asset_id);
    if (!asset) {
      wx.showToast({ title: '资产不存在', icon: 'none' });
      return;
    }

    const transaction = createTransactionRecord({
      asset,
      type,
      shares: form.shares,
      unitPrice: form.unit_price,
      amount: form.amount,
      note: form.note
    });

    applyTransactionToAsset(asset, {
      type,
      shares: form.shares,
      unit_price: form.unit_price || asset.market_price,
      amount: form.amount,
      market_price: asset.market_price
    });

    data.transactions = data.transactions || [];
    data.transactions.push(transaction);
    data.assets = data.assets.map((item) => (item.id === asset.id ? asset : item));
    wx.setStorageSync('jinji-data', data);
    app.globalData = data;

    wx.showToast({ title: '交易已保存', icon: 'success' });
    wx.navigateBack();
  }
});
