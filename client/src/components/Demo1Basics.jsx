import React, { useState } from 'react';
import {
  getClientSeal,
  generateKeys,
  encodeVector,
  encryptPlaintext,
  evaluateLocal,
  decryptAndDecode,
  CKKS_PARAMS
} from '../seal/sealManager';
import {
  parseVectorInput,
  formatVector,
  computeExact,
  computeAccuracy
} from '../utils/vectorUtils';

export default function Demo1Basics() {
  const [vectorAStr, setVectorAStr] = useState('1.5, 2.5, 3.5, 4.5');
  const [vectorBStr, setVectorBStr] = useState('10.0, 20.0, 30.0, 40.0');
  const [operation, setOperation] = useState('add');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);

  const applyPreset = (vA, vB) => {
    setVectorAStr(vA);
    setVectorBStr(vB);
    setExecutionResult(null);
    setError(null);
  };

  const handleRunEvaluation = async () => {
    setIsRunning(true);
    setError(null);
    setExecutionResult(null);

    const startTime = performance.now();
    const steps = [];

    try {
      // 1. Parse Input Vectors
      const vA = parseVectorInput(vectorAStr);
      const vB = parseVectorInput(vectorBStr);
      const len = Math.min(vA.length, vB.length);

      if (vA.length !== vB.length) {
        steps.push({
          step: 0,
          title: 'Input Validation Notice',
          detail: `Vector lengths differ (${vA.length} vs ${vB.length}). Operating on first ${len} elements.`
        });
      }

      // 2. Initialize SEAL WASM
      const sealLoadStart = performance.now();
      const { seal, context, encoder, evaluator } = await getClientSeal();
      const sealLoadTime = (performance.now() - sealLoadStart).toFixed(1);

      steps.push({
        step: 1,
        title: 'Initialize Microsoft SEAL & Key Generation',
        detail: `WASM loaded in ${sealLoadTime}ms. PolyModulusDegree: ${CKKS_PARAMS.polyModulusDegree}, Scale: 2^${CKKS_PARAMS.scalePower}, Slots: ${CKKS_PARAMS.slotCount}. Generated Secret Key, Public Key, and RelinKeys.`
      });

      const keys = generateKeys(seal, context);

      // 3. CKKS Encoding
      const plainA = encodeVector(seal, encoder, vA.slice(0, len));
      const plainB = encodeVector(seal, encoder, vB.slice(0, len));
      steps.push({
        step: 2,
        title: 'CKKS Polynomial Encoding',
        detail: `Encoded numerical vectors into plaintext polynomials with scale factor 2^${CKKS_PARAMS.scalePower}.`
      });

      // 4. Encryption
      const cipherA = encryptPlaintext(seal, context, keys.publicKey, plainA);
      const cipherB = encryptPlaintext(seal, context, keys.publicKey, plainB);
      steps.push({
        step: 3,
        title: 'Homomorphic Encryption',
        detail: `Plaintexts encrypted with Public Key into Ciphertexts. Modulus level: ${cipherA.coeffModulusSize}, Ciphertext size: ${cipherA.size} polynomials.`
      });

      // 5. Homomorphic Evaluation
      const evalStart = performance.now();
      const cipherRes = evaluateLocal(seal, evaluator, operation, cipherA, cipherB, keys.relinKeys);
      const evalTime = (performance.now() - evalStart).toFixed(2);

      let evalDetail = '';
      if (operation === 'add') {
        evalDetail = `Evaluator computed cRes = cA + cB in ${evalTime}ms without decryption. Modulus level preserved: ${cipherRes.coeffModulusSize}.`;
      } else {
        evalDetail = `Evaluator computed cRes = cA * cB, relinearized (3 -> 2 polynomials), and rescaled to next modulus level in ${evalTime}ms. Result modulus level: ${cipherRes.coeffModulusSize}.`;
      }

      steps.push({
        step: 4,
        title: `Homomorphic Evaluation (${operation.toUpperCase()})`,
        detail: evalDetail
      });

      // 6. Decryption
      const decryptedResult = decryptAndDecode(
        seal,
        context,
        keys.secretKey,
        encoder,
        cipherRes,
        len
      );

      steps.push({
        step: 5,
        title: 'Decryption & Decoding',
        detail: `Secret Key decrypted cRes into Plaintext polynomial, which was decoded back into floating-point numbers.`
      });

      // 7. Ground Truth Verification
      const exactResult = computeExact(vA.slice(0, len), vB.slice(0, len), operation);
      const accuracy = computeAccuracy(exactResult, decryptedResult);
      const totalTime = (performance.now() - startTime).toFixed(1);

      setExecutionResult({
        vA: vA.slice(0, len),
        vB: vB.slice(0, len),
        operation,
        exactResult,
        decryptedResult,
        accuracy,
        steps,
        totalTime
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during evaluation.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div className="demo-header">
        <div className="demo-badge-row">
          <span className="badge">Demo 1</span>
          <span className="badge">100% In-Browser WASM</span>
        </div>
        <h2>CKKS Basics</h2>
        <p>
          Demonstrate fundamental CKKS homomorphic operations entirely in the browser using Microsoft SEAL compiled to WebAssembly.
        </p>
      </div>

      <div className="input-section">
        {/* Preset Selector */}
        <div className="preset-bar">
          <span className="preset-title">Presets:</span>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('1.5, 2.5, 3.5, 4.5', '10.0, 20.0, 30.0, 40.0')}
          >
            Decimals
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('3.1415, 2.7182, 1.4142', '2.0, 3.0, 4.0')}
          >
            Constants
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('-5.5, 12.0, -3.2, 8.4', '2.0, -4.0, 5.0, 1.5')}
          >
            Mixed Signs
          </button>
        </div>

        {/* Vector A */}
        <div className="input-row">
          <div className="input-label-row">
            <label className="input-label">Vector A (Numerical inputs)</label>
            <span className="input-hint">Comma-separated numbers</span>
          </div>
          <input
            type="text"
            className="text-input"
            value={vectorAStr}
            onChange={(e) => setVectorAStr(e.target.value)}
            placeholder="e.g. 1.5, 2.5, 3.5, 4.5"
          />
        </div>

        {/* Vector B */}
        <div className="input-row">
          <div className="input-label-row">
            <label className="input-label">Vector B (Numerical inputs)</label>
            <span className="input-hint">Comma-separated numbers</span>
          </div>
          <input
            type="text"
            className="text-input"
            value={vectorBStr}
            onChange={(e) => setVectorBStr(e.target.value)}
            placeholder="e.g. 10.0, 20.0, 30.0, 40.0"
          />
        </div>

        {/* Operation Selector */}
        <div className="ops-wrapper">
          <div className="input-label-row">
            <label className="input-label">Homomorphic Operation</label>
          </div>
          <div className="ops-group">
            <button
              type="button"
              className={`op-button ${operation === 'add' ? 'active' : ''}`}
              onClick={() => setOperation('add')}
            >
              <span>+</span> Addition
            </button>
            <button
              type="button"
              className={`op-button ${operation === 'multiply' ? 'active' : ''}`}
              onClick={() => setOperation('multiply')}
            >
              <span>×</span> Multiplication
            </button>
          </div>
        </div>

        {/* Execution Button */}
        <button
          type="button"
          className="execute-btn"
          onClick={handleRunEvaluation}
          disabled={isRunning}
        >
          {isRunning ? 'Executing Homomorphic Pipeline...' : 'Run In-Browser Homomorphic Evaluation'}
        </button>
      </div>

      {error && <div className="error-banner">Error: {error}</div>}

      {/* Execution Results */}
      {executionResult && (
        <div className="trace-wrapper">
          <div className="trace-title">
            <span>Execution Status & Cryptographic Trace</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Completed in {executionResult.totalTime} ms
            </span>
          </div>

          {executionResult.steps.map((s, idx) => (
            <div key={idx} className="step-item">
              <div className="step-header">
                <div className="step-num-title">
                  <span className="step-num">{s.step}</span>
                  <span className="step-title">{s.title}</span>
                </div>
                <span className="step-status">Success</span>
              </div>
              <div className="step-content">
                <p style={{ color: 'var(--text-secondary)' }}>{s.detail}</p>
              </div>
            </div>
          ))}

          {/* Results Comparison Card */}
          <div className="result-card">
            <div className="result-title">
              <span>Computation Verification</span>
            </div>

            <div className="result-grid">
              <div className="result-box">
                <div className="result-box-label">Plaintext Expected Result ({operation})</div>
                <div className="result-box-val">{formatVector(executionResult.exactResult)}</div>
              </div>

              <div className="result-box">
                <div className="result-box-label">CKKS Decrypted Homomorphic Result</div>
                <div className="result-box-val">{formatVector(executionResult.decryptedResult)}</div>
              </div>
            </div>

            <div className="accuracy-bar">
              <span>CKKS Approximation Accuracy:</span>
              <span className="accuracy-stat">
                Max Abs Error: {executionResult.accuracy.maxAbsError.toExponential(3)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

