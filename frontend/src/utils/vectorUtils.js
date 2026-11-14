/**
 * Parses user input string into an array of floats.
 * Supports comma-separated, space-separated, or JSON array format.
 */
export function parseVectorInput(str) {
  if (!str || typeof str !== 'string') return [];
  // Clean surrounding brackets or spaces
  const cleaned = str.trim().replace(/^\[/, '').replace(/\]$/, '');
  const tokens = cleaned.split(/[\s,]+/).filter(t => t.length > 0);
  const nums = tokens.map(t => {
    const val = Number(t);
    return isNaN(val) ? null : val;
  });

  if (nums.some(n => n === null)) {
    throw new Error('Invalid number format. Please provide valid comma-separated numbers.');
  }

  if (nums.length === 0) {
    throw new Error('Vector cannot be empty.');
  }

  return nums;
}

/**
 * Formats a vector as a clean string [x1, x2, x3].
 */
export function formatVector(arr, precision = 6) {
  if (!arr || !Array.isArray(arr)) return '[]';
  return '[' + arr.map(n => {
    if (typeof n !== 'number') return String(n);
    // If it's very close to an integer, show rounded; otherwise show precision
    if (Math.abs(n - Math.round(n)) < 1e-9) {
      return String(Math.round(n));
    }
    return Number(n.toFixed(precision)).toString();
  }).join(', ') + ']';
}

/**
 * Computes exact unencrypted arithmetic for comparison.
 */
export function computeExact(v1, v2, operation) {
  const len = Math.min(v1.length, v2.length);
  const result = [];
  for (let i = 0; i < len; i++) {
    if (operation === 'add') {
      result.push(v1[i] + v2[i]);
    } else if (operation === 'multiply') {
      result.push(v1[i] * v2[i]);
    }
  }
  return result;
}

/**
 * Calculates error statistics between exact arithmetic and CKKS homomorphic result.
 */
export function computeAccuracy(exact, decrypted) {
  const len = Math.min(exact.length, decrypted.length);
  if (len === 0) return { maxAbsError: 0, meanAbsError: 0, errors: [] };

  const errors = [];
  let maxAbsError = 0;
  let sumAbsError = 0;

  for (let i = 0; i < len; i++) {
    const diff = Math.abs(exact[i] - decrypted[i]);
    errors.push(diff);
    if (diff > maxAbsError) maxAbsError = diff;
    sumAbsError += diff;
  }

  return {
    maxAbsError,
    meanAbsError: sumAbsError / len,
    errors
  };
}

/**
 * Formats byte size into human readable string.
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

