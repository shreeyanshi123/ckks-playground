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
 * Formats expected mathematical vector.
 */
export function formatExpectedVector(arr) {
  if (!arr || !Array.isArray(arr)) return '[]';
  return '[' + arr.map(n => {
    if (typeof n !== 'number') return String(n);
    // Keep clean representation (e.g. 3.5, 5, 4.5, 6)
    return Number(n.toFixed(6)).toString();
  }).join(', ') + ']';
}

/**
 * Formats decrypted CKKS vector to approximately 10–12 decimal places
 * without altering or rounding the underlying data.
 */
export function formatDecryptedVector(arr, precision = 10) {
  if (!arr || !Array.isArray(arr)) return '[]';
  return '[' + arr.map(n => {
    if (typeof n !== 'number') return String(n);
    return n.toFixed(precision);
  }).join(', ') + ']';
}

/**
 * Formats absolute error vector [e1, e2, ...].
 * Shows 10–12 decimal places (e.g. 0.0000000010) without altering raw data.
 */
export function formatErrorVector(arr, precision = 10) {
  if (!arr || !Array.isArray(arr)) return '[]';
  return '[' + arr.map(n => {
    if (typeof n !== 'number') return String(n);
    return n.toFixed(precision);
  }).join(', ') + ']';
}

/**
 * Computes exact unencrypted mathematical arithmetic for ground-truth comparison.
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
 * Calculates genuine CKKS error statistics on RAW unrounded decoded values:
 * absolute_error[i] = abs(expected[i] - decrypted[i])
 * max_error = max(absolute_error)
 */
export function computeAccuracy(exact, decrypted) {
  const len = Math.min(exact.length, decrypted.length);
  if (len === 0) return { maxAbsError: 0, meanAbsError: 0, absoluteErrors: [] };

  const absoluteErrors = [];
  let maxAbsError = 0;
  let sumAbsError = 0;

  for (let i = 0; i < len; i++) {
    const diff = Math.abs(exact[i] - decrypted[i]);
    absoluteErrors.push(diff);
    if (diff > maxAbsError) maxAbsError = diff;
    sumAbsError += diff;
  }

  return {
    maxAbsError,
    meanAbsError: sumAbsError / len,
    absoluteErrors
  };
}

/**
 * Validates if the computation is within a given tolerance:
 * abs(decrypted[i] - expected[i]) < tolerance
 */
export function validateTolerance(maxAbsError, tolerance = 1e-3) {
  const numTol = Number(tolerance);
  return {
    isPassed: maxAbsError <= numTol,
    maxAbsError,
    tolerance: numTol
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
