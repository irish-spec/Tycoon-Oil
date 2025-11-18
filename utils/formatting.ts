export const formatMoney = (amount: number): string => {
  if (amount < 1000) return `$${amount.toFixed(2)}`;
  
  const suffixes = ["", "k", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "d"];
  const suffixNum = Math.floor(("" + Math.floor(amount)).length / 3);
  
  let shortValue = parseFloat((suffixNum !== 0 ? (amount / Math.pow(1000, suffixNum)) : amount).toPrecision(3));
  if (shortValue % 1 !== 0) {
    shortValue = parseFloat(shortValue.toFixed(2));
  }
  
  return `$${shortValue}${suffixes[suffixNum]}`;
};

export const formatNumber = (num: number): string => {
    return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

export const calculateNextCost = (baseCost: number, currentLevel: number, count: number = 1): number => {
  // Geometric series sum: a * (r^n - 1) / (r - 1)
  // First term a is cost of next level: base * 1.15^current
  const r = 1.15;
  const a = baseCost * Math.pow(r, currentLevel);
  
  if (count === 1) return a;
  
  return a * (Math.pow(r, count) - 1) / (r - 1);
};

export const calculateMaxBuy = (baseCost: number, currentLevel: number, availableCash: number): number => {
  const r = 1.15;
  const a = baseCost * Math.pow(r, currentLevel);
  
  if (availableCash < a) return 0;
  
  // Inverse of sum formula
  // cost = a * (r^n - 1) / (r - 1)
  // cost * (r - 1) / a = r^n - 1
  // (cost * (r - 1) / a) + 1 = r^n
  // log_r(...) = n
  
  const n = Math.floor(Math.log(((availableCash * (r - 1)) / a) + 1) / Math.log(r));
  return n;
};
