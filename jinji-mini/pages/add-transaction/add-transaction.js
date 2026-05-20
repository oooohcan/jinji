const app = getApp();
const { applyTransactionToAsset, createTransactionRecord } = require('../../miniprogram/utils/transactions');

const todayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

Page({
  data: {
    assetOptions: [],
    assets: [],
    insightLabels: [],
    insights: [],
    selectedAssetIndex: 0,
    selectedType: 'BUY',
    selectedInsightIndex: 0,
    showShareFields: true,
    showPriceFields: true,
    showAmountField: false,
    form: {
      asset_id: '',
      shares: '',
      unit_price: '',
      amount: '',
      date: todayDate(),
      note: ''
    }
  },

  onLoad() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const assets = data.assets || [];
    const assetOptions = assets.map((item) => `${item.name} (${item.code})`);
    const insights = data.insights || [];
    const insightLabels = ['不关联', ...insights.map((item) => item.summary.substring(0, 30))];
    
    const form = Object.assign({}, this.data.form, { asset_id: assets[0] && assets[0].id });

    this.setData({
      assets,
      assetOptions,
      insights,
      insightLabels,
      form
    });
  },

  onAssetChange(event) {
    const index = event.detail.value;
    const asset = this.data.assets[index];
    this.setData({ selectedAssetIndex: index, form: Object.assign({}, this.data.form, { asset_id: asset.id }) });
  },

  selectType(event) {
    const type = event.currentTarget.dataset.type;
    this.setData({
      selectedType: type,
      showShareFields: type === 'BUY' || type === 'SELL',
      showPriceFields: type === 'BUY' || type === 'SELL',
      showAmountField: type === 'DIVIDEND',
      form: Object.assign({}, this.data.form, { shares: '', unit_price: '', amount: '' })
    });
  },

  onInputChange(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;
    this.setData({ ['form.' + field]: value });
  },

  onDateChange(event) {
    this.setData({ form: Object.assign({}, this.data.form, { date: event.detail.value }) });
  },

  onInsightChange(event) {
    this.setData({ selectedInsightIndex: event.detail.value });
  },

  selectImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.recognizeTransactionFromImage(res.tempFilePaths[0]);
      }
    });
  },

  takePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        this.recognizeTransactionFromImage(res.tempFilePaths[0]);
      }
    });
  },

  recognizeTransactionFromImage(filePath) {
    wx.showLoading({ title: '识别中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '交易识别功能开发中', icon: 'none' });
    }, 1500);
  },

  saveTransaction() {
    const type = this.data.selectedType;
    const form = this.data.form;

    if (!form.asset_id) {
      wx.showToast({ title: '请选择资产', icon: 'none' });
      return;
    }

    if ((type === 'BUY' || type === 'SELL') && (!form.shares || !form.unit_price)) {
      wx.showToast({ title: '请输入份额和价格', icon: 'none' });
      return;
    }

    if (type === 'DIVIDEND' && !form.amount) {
      wx.showToast({ title: '请输入分红金额', icon: 'none' });
      return;
    }

    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const asset = (data.assets || []).find((item) => item.id === form.asset_id);

    if (!asset) {
      wx.showToast({ title: '资产不存在', icon: 'none' });
      return;
    }

    const txnType = type === 'DIVIDEND' ? 'DIVIDEND_CASH' : type;
    const transaction = createTransactionRecord({
      asset,
      type: txnType,
      shares: form.shares,
      unitPrice: form.unit_price,
      amount: form.amount,
      note: form.note,
      insightId: this.data.selectedInsightIndex > 0 ? this.data.insights[this.data.selectedInsightIndex - 1].id : ''
    });

    applyTransactionToAsset(asset, {
      type: txnType,
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
    this.resetForm();
  },

  resetForm() {
    const assets = this.data.assets;
    this.setData({
      selectedAssetIndex: 0,
      selectedType: 'BUY',
      selectedInsightIndex: 0,
      showShareFields: true,
      showPriceFields: true,
      showAmountField: false,
      form: {
        asset_id: assets[0] && assets[0].id,
        shares: '',
        unit_price: '',
        amount: '',
        date: todayDate(),
        note: ''
      }
    });
  }
});
