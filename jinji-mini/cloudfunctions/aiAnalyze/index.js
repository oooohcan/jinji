exports.main = async (event) => {
  const text = (event.text || '').trim();
  if (!text) {
    return { summary: '', direction: '中性', industry: '未知', tags: [], warning: '' };
  }

  const lower = text.toLowerCase();
  const direction = lower.includes('买入') || lower.includes('看多') ? '看多' : lower.includes('卖出') || lower.includes('看空') ? '看空' : '中性';
  const industry = lower.includes('半导体') ? '半导体' : lower.includes('消费') ? '消费' : lower.includes('金融') ? '金融' : '多行业';
  const tags = [];
  if (lower.includes('分红') || lower.includes('现金流')) tags.push('现金流');
  if (lower.includes('成长') || lower.includes('扩张')) tags.push('成长');
  if (lower.includes('估值') || lower.includes('风险')) tags.push('风险');
  if (!tags.length) tags.push('信息捕捉');

  const summary = `该观点倾向${direction}，关注${industry}板块，并包含关键词：${tags.join('、')}。`;
  const warning = lower.includes('卖出') && lower.includes('看多') ? '当前观点与卖出操作可能存在逻辑冲突，请复盘。' : '';

  return { summary, direction, industry, tags, warning };
};
