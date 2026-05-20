const { convertToCny } = require('./finance');

const round = (value, digits = 4) => Number(Number(value).toFixed(digits));

const applyTransactionToAsset = (asset, transaction) => {
  const existingShares = Number(asset.total_shares || 0);
  const existingCostBasis = Number(asset.cost_basis || 0);
  const existingValue = existingCostBasis * existingShares;

  const updateMarketPrice = (price) => {
    asset.market_price = Number(price || asset.market_price || 0);
  };

  switch (transaction.type) {
    case 'BUY': {
      const shares = Number(transaction.shares || 0);
      const price = Number(transaction.unit_price || 0);
      const totalCost = existingValue + shares * price;
      const newShares = existingShares + shares;
      asset.total_shares = newShares;
      asset.cost_basis = newShares > 0 ? round(totalCost / newShares, 6) : 0;
      updateMarketPrice(price);
      break;
    }
    case 'SELL': {
      const shares = Number(transaction.shares || 0);
      const price = Number(transaction.unit_price || 0);
      asset.total_shares = Math.max(0, existingShares - shares);
      if (asset.total_shares === 0) {
        asset.cost_basis = 0;
      }
      updateMarketPrice(price);
      break;
    }
    case 'DIVIDEND_REINVEST': {
      const amount = Number(transaction.amount || 0);
      const marketPrice = Number(asset.market_price || transaction.market_price || 0);
      const reinvestShares = marketPrice > 0 ? amount / marketPrice : 0;
      const totalCost = existingValue + amount;
      asset.total_shares = existingShares + reinvestShares;
      asset.cost_basis = asset.total_shares > 0 ? round(totalCost / asset.total_shares, 6) : 0;
      updateMarketPrice(marketPrice);
      break;
    }
    case 'DIVIDEND_CASH': {
      const amount = Number(transaction.amount || 0);
      const totalCost = Math.max(0, existingValue - amount);
      asset.cost_basis = existingShares > 0 ? round(totalCost / existingShares, 6) : 0;
      break;
    }
    default:
      break;
  }

  asset.total_shares = Number(asset.total_shares || 0);
  asset.cost_basis = Number(asset.cost_basis || 0);
  return asset;
};

const createTransactionRecord = ({ asset, type, shares, unitPrice, amount, note, insightId }) => {
  const cashAmount = type === 'BUY' || type === 'SELL' ? Number(shares || 0) * Number(unitPrice || 0) : Number(amount || 0);
  return {
    id: `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    asset_id: asset.id,
    account_id: asset.account_id,
    type,
    shares: Number(shares || 0),
    unit_price: Number(unitPrice || 0),
    amount: cashAmount,
    note: note || '',
    insight_id: insightId || '',
    created_at: new Date().toISOString()
  };
};

const buildAssetDisplay = (asset, settings = {}) => {
  const marketValue = convertToCny((asset.market_price || 0) * (asset.total_shares || 0), asset.currency, settings.exchangeRates || {});
  const costValue = convertToCny((asset.cost_basis || 0) * (asset.total_shares || 0), asset.currency, settings.exchangeRates || {});
  return Object.assign({}, asset, {
    marketValue: marketValue.toFixed(2),
    costValue: costValue.toFixed(2)
  });
};

module.exports = {
  applyTransactionToAsset,
  createTransactionRecord,
  buildAssetDisplay
};
