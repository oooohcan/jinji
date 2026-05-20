const app = getApp();

Page({
  data: {
    sourceText: '',
    result: {},
    insights: []
  },

  onShow() {
    this.loadInsights();
  },

  loadInsights() {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    const insights = (data.insights || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    this.setData({ insights });
  },

  onSourceInput(event) {
    this.setData({ sourceText: event.detail.value });
  },

  clearInput() {
    this.setData({ sourceText: '', result: {} });
  },

  analyzeText() {
    const sourceText = (this.data.sourceText || '').trim();
    if (!sourceText) {
      wx.showToast({ title: '请输入文本或链接', icon: 'none' });
      return;
    }

    try {
      const result = this.callAiAnalyze(sourceText);
      this.setData({ result });
      this.saveInsight(result);
    } catch (error) {
      console.error(error);
      wx.showToast({ title: 'AI 分析服务当前不可用', icon: 'none' });
    }
  },

  callAiAnalyze(text) {
    const lower = text.toLowerCase();
    const direction = lower.includes('买入') || lower.includes('看多') ? '看多' : lower.includes('卖出') || lower.includes('看空') ? '看空' : '中性';
    const industry = lower.includes('半导体') ? '半导体' : lower.includes('消费') ? '消费' : lower.includes('金融') ? '金融' : lower.includes('医药') ? '医药' : '多行业';
    const tags = [];
    if (lower.includes('分红') || lower.includes('现金流')) tags.push('现金流');
    if (lower.includes('成长') || lower.includes('扩张')) tags.push('成长');
    if (lower.includes('估值') || lower.includes('风险')) tags.push('风险');
    if (lower.includes('技术面') || lower.includes('图表')) tags.push('技术面');
    if (!tags.length) tags.push('信息捕捉');

    const summary = `该观点倾向${direction}，关注${industry}板块。`;
    const warning = lower.includes('卖出') && lower.includes('看多') ? '当前观点与卖出操作存在冲突，请复盘投资逻辑。' : '';

    return { summary, direction, industry, tags, warning };
  },

  saveInsight(result) {
    const data = wx.getStorageSync('jinji-data') || app.globalData;
    data.insights = data.insights || [];
    data.insights.unshift({
      id: `insight-${Date.now()}`,
      text: this.data.sourceText,
      summary: result.summary,
      direction: result.direction,
      industry: result.industry,
      tags: result.tags,
      warning: result.warning,
      created_at: new Date().toISOString().split('T')[0]
    });
    wx.setStorageSync('jinji-data', data);
    app.globalData = data;
    wx.showToast({ title: '笔记已保存', icon: 'success' });
    this.setData({ sourceText: '' });
    this.loadInsights();
  }
});
