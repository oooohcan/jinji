const STORAGE_KEY = 'jinji-data';

const loadData = () => {
  const data = wx.getStorageSync(STORAGE_KEY) || {};
  return data.initialized ? data : null;
};

const saveData = (data) => {
  try {
    wx.setStorageSync(STORAGE_KEY, Object.assign({ initialized: true }, data));
    return true;
  } catch (error) {
    console.error('Storage save failed', error);
    return false;
  }
};

module.exports = {
  loadData,
  saveData
};
