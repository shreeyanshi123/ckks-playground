/**
 * Service for communicating with the Node.js CKKS Evaluator backend.
 */
export async function checkServerHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { online: false, error: `HTTP ${res.status}` };
    }
    const data = await res.json();
    return { online: true, data };
  } catch (err) {
    return { online: false, error: err.message };
  }
}

/**
 * Sends encrypted ciphertexts to the untrusted server for homomorphic evaluation.
 */
export async function computeOutsource({ operation, ciphertextA, ciphertextB, relinKeys }) {
  const response = await fetch('/api/compute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      operation,
      ciphertextA,
      ciphertextB,
      relinKeys
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned HTTP ${response.status}`);
  }

  return await response.json();
}
