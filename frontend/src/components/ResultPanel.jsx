import React from 'react';

/**
 * Format vector array cleanly with rounded floats.
 */
function formatVectorDisplay(arr, precision = 4) {
  if (!arr || !Array.isArray(arr)) return '[]';
  return (
    '[' +
    arr
      .map((n) => {
        if (typeof n !== 'number') return String(n);
        // If within 1e-6 of integer, format neatly
        if (Math.abs(n - Math.round(n)) < 1e-6) {
          return String(Math.round(n));
        }
        return Number(n.toFixed(precision)).toString();
      })
      .join(', ') +
    ']'
  );
}

export default function ResultPanel({
  decryptedResult,
  expectedResult,
  operation,
  accuracy,
  executionTimeMs,
  privacyAudit = null
}) {
  if (!decryptedResult) return null;

  return (
    <div className="mt-6 p-5 bg-white border border-gray-200 rounded-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h4 className="text-sm font-semibold text-gray-900">
          Decrypted Result & Accuracy Verification
        </h4>
        {executionTimeMs && (
          <span className="text-xs font-mono text-gray-500">
            Computed in {executionTimeMs} ms
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Decrypted Vector */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-md">
          <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            CKKS Decrypted Vector (Approximate Arithmetic)
          </span>
          <div className="font-mono text-sm font-medium text-gray-900 break-all">
            {formatVectorDisplay(decryptedResult)}
          </div>
        </div>

        {/* Expected Plaintext */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-md">
          <span className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Expected Plaintext ({operation === 'add' ? 'Addition' : 'Multiplication'})
          </span>
          <div className="font-mono text-sm text-gray-700 break-all">
            {formatVectorDisplay(expectedResult)}
          </div>
        </div>
      </div>

      {/* Accuracy Stats */}
      {accuracy && (
        <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-md text-xs">
          <span className="text-gray-700">
            CKKS Noise / Approximation Error:
          </span>
          <span className="font-mono font-semibold text-blue-900">
            Max Absolute Error = {accuracy.maxAbsError.toExponential(3)}
          </span>
        </div>
      )}

      {/* Zero-Knowledge Privacy Audit (for Demo 2) */}
      {privacyAudit && (
        <div className="pt-2">
          <span className="block text-xs font-semibold text-gray-700 mb-2">
            Zero-Knowledge Privacy Verification
          </span>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-gray-200 rounded-md">
              <thead>
                <tr className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <th className="p-2 border-r border-gray-200">Entity</th>
                  <th className="p-2 border-r border-gray-200">Data Visibility</th>
                  <th className="p-2 border-r border-gray-200">Secret Key</th>
                  <th className="p-2">Plaintext Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="p-2 font-medium text-gray-900 border-r border-gray-200">Client (Browser)</td>
                  <td className="p-2 text-gray-600 border-r border-gray-200">Plaintext Inputs & Decrypted Output</td>
                  <td className="p-2 text-green-600 font-semibold border-r border-gray-200">Retained in WASM</td>
                  <td className="p-2 text-green-600 font-medium">Full Access</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium text-gray-900 border-r border-gray-200">Server (Node.js)</td>
                  <td className="p-2 text-gray-600 border-r border-gray-200">Encrypted Ciphertexts ({privacyAudit.payloadSize})</td>
                  <td className="p-2 text-red-600 font-semibold border-r border-gray-200">ZERO Access</td>
                  <td className="p-2 text-green-600 font-medium">Completely Blinded (Zero Knowledge)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
