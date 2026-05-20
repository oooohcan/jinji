const app = getApp();

Page({
  data: {
    assetTypes: ['股票（A）', '股票（港）', '股票（美）', '场外基金', '银行理财', '固定存款', '黄金'],
    assetTypeMap: ['A', 'HK', 'US', 'FUND', 'BANK', 'DEPOSIT', 'GOLD'],
    assetTypesCurrency: ['CNY', 'HKD', 'USD', 'CNY', 'CNY', 'CNY', 'CNY'],
    selectedTypeIndex: 0,
    accountOptions: [],
    selectedAccountIndex: 0,
    batchPreview: [],
    form: {
      name: '',
      code: '',
      total_shares: '',
      cost_basis: '',
      market_price: '',
      account_id: ''
    }
  },

  onLoad() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const accountOptions = (data.accounts || []).map((account) => account.name);
    this.setData({
      accountOptions,
      form: Object.assign({}, this.data.form, { account_id: data.accounts[0] && data.accounts[0].id })
    });
  },

  onAssetTypeChange(event) {
    this.setData({ selectedTypeIndex: event.detail.value });
  },

  onAccountChange(event) {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const account = data.accounts[event.detail.value];
    this.setData({ selectedAccountIndex: event.detail.value, form: Object.assign({}, this.data.form, { account_id: account.id }) });
  },

  onInputChange(event) {
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;
    this.setData({ ['form.' + field]: value });
  },

  resetForm() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    this.setData({
      form: {
        name: '',
        code: '',
        total_shares: '',
        cost_basis: '',
        market_price: '',
        account_id: data.accounts[0] && data.accounts[0].id
      }
    });
  },

  selectImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album'],
      success: (res) => {
        this.recognizeAssetsFromImage(res.tempFilePaths[0]);
      }
    });
  },

  takePhoto() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['camera'],
      success: (res) => {
        this.recognizeAssetsFromImage(res.tempFilePaths[0]);
      }
    });
  },

  recognizeAssetsFromImage(filePath) {
    wx.showLoading({ title: '识别中...' });
    
    // 模拟OCR识别，实际应调用云函数或第三方API
    setTimeout(() => {
      wx.hideLoading();
      
      const mockResults = [
        { name: '茅台', code: '600519', total_shares: '8', cost_basis: '210.00', market_price: '239.50', typeIndex: 0 },
        { name: '腾讯', code: '00700', total_shares: '10', cost_basis: '380.00', market_price: '420.30', typeIndex: 1 },
        { name: '易方达消费', code: '110022', total_shares: '100', cost_basis: '3.50', market_price: '4.20', typeIndex: 3 }
      ];
      
      this.setData({ batchPreview: mockResults });
      wx.showToast({ title: '识别到 ' + mockResults.length + ' 个资产', icon: 'success' });
    }, 1500);
  },

  onBatchTypeChange(event) {
    const index = event.currentTarget.dataset.index;
    const typeIndex = event.detail.value;
    const batchPreview = this.data.batchPreview;
    batchPreview[index].typeIndex = typeIndex;
    this.setData({ batchPreview });
  },

  onBatchFieldChange(event) {
    const index = event.currentTarget.dataset.index;
    const field = event.currentTarget.dataset.field;
    const value = event.detail.value;
    const batchPreview = this.data.batchPreview;
    batchPreview[index][field] = value;
    this.setData({ batchPreview });
  },

  removeBatchItem(event) {
    const index = event.currentTarget.dataset.index;
    const batchPreview = this.data.batchPreview;
    batchPreview.splice(index, 1);
    this.setData({ batchPreview: batchPreview.length ? batchPreview : [] });
  },

  closeBatchPreview() {
    this.setData({ batchPreview: [] });
  },

  saveBatchAssets() {
    const batchPreview = this.data.batchPreview;
    if (!batchPreview.length) {
      wx.showToast({ title: '没有可导入的资产', icon: 'none' });
      return;
    }

    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const selectedAccount = data.accounts[this.data.selectedAccountIndex];
    
    let failCount = 0;
    batchPreview.forEach((item) => {
      if (!item.name || !item.code || !item.total_shares || !item.cost_basis || !item.market_price) {
        failCount++;
        return;
      }

      const newAsset = {
        id: `asset-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: item.name,
        code: item.code,
        asset_type: this.data.assetTypeMap[item.typeIndex] || 'OTHER',
        currency: this.data.assetTypesCurrency[item.typeIndex] || 'CNY',
        total_shares: Number(item.total_shares),
        cost_basis: Number(item.cost_basis),
        market_price: Number(item.market_price),
        account_id: selectedAccount.id,
        created_at: new Date().toISOString()
      };
      data.assets = data.assets || [];
      data.assets.push(newAsset);
    });

    wx.setStorageSync('jinji-data', data);
    app.globalData = data;
    
    const successCount = batchPreview.length - failCount;
    wx.showToast({ title: `成功导入 ${successCount} 个资产`, icon: 'success' });
    this.setData({ batchPreview: [] });
  },

  saveAsset() {
    const form = this.data.form;
    if (!form.name || !form.code || !form.total_shares || !form.cost_basis || !form.market_price || !form.account_id) {
      wx.showToast({ title: '请补全资产信息', icon: 'none' });
      return;
    }

    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const assetType = this.data.assetTypeMap[this.data.selectedTypeIndex] || 'OTHER';
    const newAsset = {
      id: `asset-${Date.now()}`,
      name: form.name,
      code: form.code,
      asset_type: assetType,
      currency: this.data.assetTypesCurrency[this.data.selectedTypeIndex] || 'CNY',
      total_shares: Number(form.total_shares),
      cost_basis: Number(form.cost_basis),
      market_price: Number(form.market_price),
      account_id: form.account_id,
      created_at: new Date().toISOString()
    };
    data.assets = data.assets || [];
    data.assets.push(newAsset);
    wx.setStorageSync('jinji-data', data);
    app.globalData = data;
    wx.showToast({ title: '资产已保存', icon: 'success' });
    this.resetForm();
  }
});
