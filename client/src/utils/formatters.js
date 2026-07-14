export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === undefined || amount === null || amount === '') return amount;
  
  // Clean string inputs containing commas or existing currency symbols
  let num = amount;
  if (typeof amount === 'string') {
    const cleaned = amount.replace(/[,₹$€]/g, '').trim();
    if (cleaned.toLowerCase() === 'negotiable' || cleaned === '---') return amount;
    num = Number(cleaned);
  }
  
  if (isNaN(num)) return amount;
  
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);

  // Hardcode INR symbol for consistency if currency is INR
  if (currency === 'INR') {
    return `₹${formatted}`;
  } else if (currency === 'USD') {
    return `$${formatted}`;
  }
  return `${currency} ${formatted}`;
};
