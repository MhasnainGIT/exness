function toDecimal(value, fallback = 0) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }

  return numeric;
}

function roundCurrency(value) {
  return Number(toDecimal(value).toFixed(2));
}

function roundPrice(value, decimals = 5) {
  return Number(toDecimal(value).toFixed(decimals));
}

module.exports = { toDecimal, roundCurrency, roundPrice };
