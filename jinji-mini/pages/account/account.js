const app = getApp();

Page({
  data: {
    accounts: [],
    accountOptions: [],
    selectedAccountIndex: 0,
    newAccountName: ''
  },

  onLoad() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const accounts = data.accounts || [];
    const accountOptions = accounts.map((account) => account.name);
    this.setData({ accounts, accountOptions });
  },

  onAccountSelect(event) {
    this.setData({ selectedAccountIndex: event.detail.value });
  },

  onNewAccountInput(event) {
    this.setData({ newAccountName: event.detail.value });
  },

  addAccount() {
    const name = (this.data.newAccountName || '').trim();
    if (!name) {
      wx.showToast({ title: '请输入账户名称', icon: 'none' });
      return;
    }
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    data.accounts = data.accounts || [];
    const newAccount = {
      id: `acc-${Date.now()}`,
      name,
      type: 'custom',
      hidden: false
    };
    data.accounts.push(newAccount);
    wx.setStorageSync('jinji-data', data);
    app.globalData = data;
    const accountOptions = data.accounts.map((account) => account.name);
    this.setData({ accounts: data.accounts, accountOptions, newAccountName: '', selectedAccountIndex: accountOptions.length - 1 });
    wx.showToast({ title: '账户已添加', icon: 'success' });
  }
});
