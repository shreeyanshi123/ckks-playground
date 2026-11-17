import React, { useState } from 'react';
import {
  formatExpectedVector,
  formatDecryptedVector,
  formatErrorVector,
  validateTolerance
} from '../utils/vectorUtils';

export default function ResultPanel({
  decryptedResult,
  expectedResult,
  operation,
  accuracy,
  executionTimeMs,
  privacyAudit = null
}) {
  const [tolerance, setTolerance] = useState('0.001'); // Default educational tolerance 1e-3

  if (!decryptedResult) return null;

  const maxAbsError = accuracy ? accuracy.maxAbsError : 0;
  const validation = validateTolerance(maxAbsError, tolerance);

  return (
    <div className="mt-6 p-5 bg-white border border-gray-200 rounded-lg space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h4 className="text-sm font-bold text-gray-900">
            CKKS Decrypted Result & Precision Analysis
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Approximate arithmetic comparison against exact mathematical expected values.
          </p>
        </div>
        {executionTimeMs && (
          <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-200">
            Computed in {executionTimeMs} ms
          </span>
        )}
      </div>

      {/* Main Results Grid */}
      <div className="space-y-3">
        {/* 1. Expected Mathematical Result */}
        <div className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
              Expected Mathematical Result ({operation === 'add' ? 'Addition' : 'Multiplication'})
            </span>
            <span className="text-[11px] text-gray-400 font-mono">Unencrypted Ground Truth</span>
          </div>
          <div className="font-mono text-sm font-semibold text-gray-900 break-all">
            {formatExpectedVector(expectedResult)}
          </div>
        </div>

        {/* 2. Actual CKKS Decrypted Result */}
        <div className="p-3.5 bg-blue-50/40 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">
              Actual CKKS Decrypted Result (~10–12 Decimal Places)
            </span>
            <span className="text-[11px] text-blue-600 font-mono">Decoded from SEAL WASM</span>
          </div>
          <div className="font-mono text-sm font-bold text-blue-950 break-all">
            {formatDecryptedVector(decryptedResult, 10)}
          </div>
        </div>

        {/* 3. Absolute Error Vector */}
        {accuracy && accuracy.absoluteErrors && (
          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                Absolute Error Vector |Expected[i] - Decrypted[i]|
              </span>
              <span className="text-[11px] text-gray-500 font-mono">Element-wise Noise</span>
            </div>
            <div className="font-mono text-xs text-gray-800 break-all">
              {formatErrorVector(accuracy.absoluteErrors, 10)}
            </div>
          </div>
        )}
      </div>

      {/* Numerical Tolerance & Validation Section */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-gray-800">
              Configurable Numerical Tolerance:
            </span>
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={tolerance}
                onChange={(e) => setTolerance(e.target.value)}
                className="w-20 px-2 py-0.5 text-xs font-mono bg-white border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="0.001"
              />
              <button
                type="button"
                onClick={() => setTolerance('0.001')}
                className="px-1.5 py-0.5 text-[10px] text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                1e-3
              </button>
              <button
                type="button"
                onClick={() => setTolerance('0.0001')}
                className="px-1.5 py-0.5 text-[10px] text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                1e-4
              </button>
              <button
                type="button"
                onClick={() => setTolerance('0.000001')}
                className="px-1.5 py-0.5 text-[10px] text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100"
              >
                1e-6
              </button>
            </div>
          </div>

          {/* Validation Result Badge */}
          <div className="flex items-center space-x-2">
            {validation.isPassed ? (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-green-800 bg-green-100 border border-green-300 rounded-full">
                <svg className="w-3.5 h-3.5 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                PASSED (Within Tolerance)
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-red-800 bg-red-100 border border-red-300 rounded-full">
                <svg className="w-3.5 h-3.5 mr-1 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                EXCEEDED (Max error &gt; tolerance)
              </span>
            )}
          </div>
        </div>

        {/* Error Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between p-2 bg-white rounded border border-gray-200">
            <span className="text-gray-600">Maximum Absolute Error:</span>
            <span className="font-mono font-bold text-gray-900">
              {maxAbsError.toExponential(3)} ({maxAbsError.toFixed(10)})
            </span>
          </div>
          <div className="flex justify-between p-2 bg-white rounded border border-gray-200">
            <span className="text-gray-600">Mean Absolute Error:</span>
            <span className="font-mono font-bold text-gray-900">
              {accuracy ? accuracy.meanAbsError.toExponential(3) : '0'}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed">
          * <strong>CKKS Educational Note:</strong> Small numerical differences are expected because CKKS uses canonical embedding and floating-point rescaling ($\Delta = 2^{30}$). The test passes because |decrypted[i] - expected[i]| remains well within tolerance.
        </p>
      </div>

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
