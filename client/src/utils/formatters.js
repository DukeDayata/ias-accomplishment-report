/**
 * Formats a number to Philippine Peso (PHP) currency string
 * @param {number} amount 
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₱0.00';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formats a number with thousands separators
 * @param {number} num 
 * @returns {string}
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-PH').format(num);
};

/**
 * Formats a number in compact format (e.g. 1.2M, 50K)
 * @param {number} num 
 * @returns {string}
 */
export const formatCompactNumber = (num) => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-PH', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num);
};

/**
 * Formats a currency amount in compact format (e.g. ₱1.2M)
 * @param {number} amount 
 * @returns {string}
 */
export const formatCompactCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₱0';
  return '₱' + formatCompactNumber(amount);
};

/**
 * Normalizes text for comparison and search
 * @param {string} str 
 * @returns {string}
 */
export const normalizeString = (str) => {
  if (!str) return '';
  return str.toString().trim().toLowerCase();
};

/**
 * Maps a month name or timeline string to its corresponding quarter (Q1, Q2, Q3, Q4)
 * @param {string} monthStr 
 * @returns {string} 'Q1' | 'Q2' | 'Q3' | 'Q4' | ''
 */
export const getMonthQuarter = (monthStr) => {
  if (!monthStr) return '';
  const upper = monthStr.toString().toUpperCase().trim();
  
  // Direct matching for quarter references
  if (['Q1', '1ST QUARTER', 'FIRST QUARTER', 'JAN-MAR', 'JAN - MAR', 'JANUARY-MARCH'].some(q => upper.includes(q))) {
    return 'Q1';
  }
  if (['Q2', '2ND QUARTER', 'SECOND QUARTER', 'APR-JUN', 'APR - JUN', 'APRIL-JUNE'].some(q => upper.includes(q))) {
    return 'Q2';
  }
  if (['Q3', '3RD QUARTER', 'THIRD QUARTER', 'JUL-SEP', 'JUL - SEP', 'JULY-SEPTEMBER'].some(q => upper.includes(q))) {
    return 'Q3';
  }
  if (['Q4', '4TH QUARTER', 'FOURTH QUARTER', 'OCT-DEC', 'OCT - DEC', 'OCTOBER-DECEMBER'].some(q => upper.includes(q))) {
    return 'Q4';
  }
  
  // Checking month lists
  if (['JAN', 'JANUARY', 'FEB', 'FEBRUARY', 'MAR', 'MARCH'].some(m => upper.includes(m))) {
    return 'Q1';
  }
  if (['APR', 'APRIL', 'MAY', 'JUN', 'JUNE'].some(m => upper.includes(m))) {
    return 'Q2';
  }
  if (['JUL', 'JULY', 'AUG', 'AUGUST', 'SEP', 'SEPT', 'SEPTEMBER'].some(m => upper.includes(m))) {
    return 'Q3';
  }
  if (['OCT', 'OCTOBER', 'NOV', 'NOVEMBER', 'DEC', 'DECEMBER'].some(m => upper.includes(m))) {
    return 'Q4';
  }
  
  // Numerical fallback
  const numVal = parseInt(upper, 10);
  if (!isNaN(numVal)) {
    if (numVal >= 1 && numVal <= 3) return 'Q1';
    if (numVal >= 4 && numVal <= 6) return 'Q2';
    if (numVal >= 7 && numVal <= 9) return 'Q3';
    if (numVal >= 10 && numVal <= 12) return 'Q4';
  }

  return '';
};
