const convertToCny = (value, currency, rates) => {
  if (currency === 'CNY' || !currency) return Number(value) || 0;
  const rate = rates[currency] || 1;
  return Number(value) * rate;
};

const formatAmount = (value, privacyMode) => {
  if (privacyMode) return '****';
  return typeof value === 'number' ? value.toFixed(2) : value;
};

const computePnL = (asset, rates) => {
  const cost = convertToCny(asset.cost_basis * asset.total_shares, asset.currency, rates);
  const market = convertToCny(asset.market_price * asset.total_shares, asset.currency, rates);
  return market - cost;
};

module.exports = {
  convertToCny,
  formatAmount,
  computePnL
};
