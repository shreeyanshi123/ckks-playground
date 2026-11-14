import React, { useState, useEffect } from 'react';
import {
  getClientSeal,
  generateKeys,
  encodeVector,
  encryptPlaintext,
  decryptAndDecode,
  serializeCiphertext,
  deserializeCiphertext,
  serializeRelinKeys,
  CKKS_PARAMS
} from '../seal/sealManager';
import {
  parseVectorInput,
  formatVector,
  computeExact,
  computeAccuracy,
  formatBytes
} from '../utils/vectorUtils';

export default function Demo2ClientServer() {
  const [vectorAStr, setVectorAStr] = useState('12.5, 45.0, 78.2, 90.1');
  const [vectorBStr, setVectorBStr] = useState('3.0, 2.5, 4.0, 1.5');
  const [operation, setOperation] = useState('multiply');
  const [isRunning, setIsRunning] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);
  const [serverInfo, setServerInfo] = useState(null);
  const [error, setError] = useState(null);
  const [executionResult, setExecutionResult] = useState(null);

  // Check server health on mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setServerOnline(true);
        setServerInfo(data);
      } else {
        setServerOnline(false);
      }
    } catch {
      setServerOnline(false);
    }
  };

  const applyPreset = (vA, vB) => {
    setVectorAStr(vA);
    setVectorBStr(vB);
    setExecutionResult(null);
    setError(null);
  };

  const handleOutsourceComputation = async () => {
    setIsRunning(true);
    setError(null);
    setExecutionResult(null);

    const startTime = performance.now();
    const steps = [];

    try {
      // 1. Parse Inputs
      const vA = parseVectorInput(vectorAStr);
      const vB = parseVectorInput(vectorBStr);
      const len = Math.min(vA.length, vB.length);

      // 2. Client-Side SEAL & Key Generation
      const { seal, context, encoder } = await getClientSeal();
      const keys = generateKeys(seal, context);

      steps.push({
        phase: 'Client',
        step: 1,
        title: 'Client Key Generation (Private)',
        detail: `Client generated Secret Key, Public Key, and RelinKeys. The Secret Key is strictly retained in browser memory and NEVER transmitted to the server.`
      });

      // 3. Client Encoding & Encryption
      const plainA = encodeVector(seal, encoder, vA.slice(0, len));
      const plainB = encodeVector(seal, encoder, vB.slice(0, len));
      const cipherA = encryptPlaintext(seal, context, keys.publicKey, plainA);
      const cipherB = encryptPlaintext(seal, context, keys.publicKey, plainB);

      // 4. Client Serialization
      const b64CipherA = serializeCiphertext(seal, cipherA);
      const b64CipherB = serializeCiphertext(seal, cipherB);
      let b64RelinKeys = null;

      if (operation === 'multiply') {
        b64RelinKeys = serializeRelinKeys(seal, keys.relinKeys);
      }

      const payloadSizeBytes =
        b64CipherA.length +
        b64CipherB.length +
        (b64RelinKeys ? b64RelinKeys.length : 0);

      steps.push({
        phase: 'Client',
        step: 2,
        title: 'Client Data Encryption & Serialization',
        detail: `Client encrypted private vectors into ciphertexts. Payload prepared: Ciphertext A (${formatBytes(b64CipherA.length)}), Ciphertext B (${formatBytes(b64CipherB.length)})${operation === 'multiply' ? `, RelinKeys (${formatBytes(b64RelinKeys.length)})` : ''}. Total payload: ${formatBytes(payloadSizeBytes)}.`
      });

      // 5. Transmission: Client -> Server
      const netStartTime = performance.now();
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          ciphertextA: b64CipherA,
          ciphertextB: b64CipherB,
          relinKeys: b64RelinKeys
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with HTTP ${response.status}`);
      }

      const serverData = await response.json();
      const netRoundtripTime = (performance.now() - netStartTime).toFixed(1);

      steps.push({
        phase: 'Server',
        step: 3,
        title: 'Untrusted Server Homomorphic Computation',
        detail: `Server evaluated ${operation.toUpperCase()} in ${serverData.executionTimeMs}ms. Notice: The server has NO access to the client secret key and processed raw encrypted ciphertext polynomials.`,
        serverLogs: serverData.serverLogs
      });

      // 6. Client Decryption of Server Result
      const clientResCipher = deserializeCiphertext(seal, context, serverData.encryptedResult);
      const decryptedResult = decryptAndDecode(
        seal,
        context,
        keys.secretKey,
        encoder,
        clientResCipher,
        len
      );

      steps.push({
        phase: 'Client',
        step: 4,
        title: 'Client Decryption & Result Retrieval',
        detail: `Client received encrypted result from server (${formatBytes(serverData.encryptedResult.length)}) and successfully decrypted it using its private Secret Key.`
      });

      // 7. Accuracy Verification
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
        totalTime,
        netRoundtripTime,
        serverTime: serverData.executionTimeMs,
        payloadSize: formatBytes(payloadSizeBytes),
        sampleCiphertextPreview: b64CipherA.substring(0, 80) + '...'
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Server evaluation failed.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <div className="demo-header">
        <div className="demo-badge-row">
          <span className="badge">Demo 2</span>
          <span className={`badge ${serverOnline ? 'badge-server' : ''}`}>
            Server: {serverOnline === null ? 'Checking...' : serverOnline ? 'Online (Node.js)' : 'Offline'}
          </span>
        </div>
        <h2>Client–Server CKKS</h2>
        <p>
          Demonstrate how a client can outsource computation to an untrusted remote server without revealing its private data.
        </p>
      </div>

      {serverOnline === false && (
        <div className="error-banner">
          Warning: Node.js evaluation server is currently unreachable at <code>http://localhost:5001</code>.
          Make sure the backend server is running (<code>npm run server</code> or Docker container).
          <button
            type="button"
            onClick={checkServerHealth}
            style={{ marginLeft: '12px', padding: '2px 8px', fontSize: '12px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            Retry Connection
          </button>
        </div>
      )}

      <div className="input-section">
        {/* Preset Selector */}
        <div className="preset-bar">
          <span className="preset-title">Presets:</span>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('12.5, 45.0, 78.2, 90.1', '3.0, 2.5, 4.0, 1.5')}
          >
            Telemetry
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('100.5, 250.0, 310.25', '1.08, 1.05, 1.12')}
          >
            Financial Rates
          </button>
          <button
            type="button"
            className="preset-btn"
            onClick={() => applyPreset('0.85, 0.42, 0.91, 0.15', '0.50, 0.60, 0.70, 0.80')}
          >
            Probabilities
          </button>
        </div>

        {/* Vector A */}
        <div className="input-row">
          <div className="input-label-row">
            <label className="input-label">Private Client Vector A</label>
            <span className="input-hint">Kept confidential from server</span>
          </div>
          <input
            type="text"
            className="text-input"
            value={vectorAStr}
            onChange={(e) => setVectorAStr(e.target.value)}
            placeholder="e.g. 12.5, 45.0, 78.2, 90.1"
          />
        </div>

        {/* Vector B */}
        <div className="input-row">
          <div className="input-label-row">
            <label className="input-label">Private Client Vector B</label>
            <span className="input-hint">Kept confidential from server</span>
          </div>
          <input
            type="text"
            className="text-input"
            value={vectorBStr}
            onChange={(e) => setVectorBStr(e.target.value)}
            placeholder="e.g. 3.0, 2.5, 4.0, 1.5"
          />
        </div>

        {/* Operation Selector */}
        <div className="ops-wrapper">
          <div className="input-label-row">
            <label className="input-label">Outsourced Operation</label>
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
          onClick={handleOutsourceComputation}
          disabled={isRunning || serverOnline === false}
        >
          {isRunning ? 'Outsourcing to Remote Server...' : 'Encrypt & Outsource to Server'}
        </button>
      </div>

      {error && <div className="error-banner">Error: {error}</div>}

      {/* Execution Results */}
      {executionResult && (
        <div className="trace-wrapper">
          <div className="trace-title">
            <span>Client–Server Interaction Flow</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Total: {executionResult.totalTime} ms (Server Eval: {executionResult.serverTime} ms)
            </span>
          </div>

          {executionResult.steps.map((s, idx) => (
            <div key={idx} className="step-item">
              <div className="step-header">
                <div className="step-num-title">
                  <span className="badge" style={{ fontSize: '10px' }}>{s.phase}</span>
                  <span className="step-title">{s.title}</span>
                </div>
                <span className="step-status">Verified</span>
              </div>
              <div className="step-content">
                <p style={{ color: 'var(--text-secondary)', marginBottom: s.serverLogs ? '12px' : '0' }}>
                  {s.detail}
                </p>
                {s.serverLogs && (
                  <div className="payload-box">
                    <strong>Server Execution Log:</strong>
                    {s.serverLogs.map((log, i) => (
                      <div key={i}>• {log}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Privacy Verification Table */}
          <div className="result-card">
            <div className="result-title">
              <span>Zero-Knowledge Privacy Audit</span>
            </div>

            <table className="arch-table" style={{ marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Data Possessed</th>
                  <th>Secret Key?</th>
                  <th>Plaintext Visibility</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Client (Browser)</strong></td>
                  <td>Private Vectors, Secret Key, Public Key, Decrypted Result</td>
                  <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>Yes (Private)</td>
                  <td>Full Visibility</td>
                </tr>
                <tr>
                  <td><strong>Server (Cloud)</strong></td>
                  <td>Encrypted Ciphertexts ({executionResult.payloadSize}), RelinKeys</td>
                  <td style={{ color: 'var(--error)', fontWeight: 'bold' }}>NO (Zero Access)</td>
                  <td style={{ color: 'var(--success)' }}>Completely Blinded</td>
                </tr>
              </tbody>
            </table>

            <div className="result-grid">
              <div className="result-box">
                <div className="result-box-label">Client Private Vectors</div>
                <div className="result-box-val">
                  A: {formatVector(executionResult.vA)}<br />
                  B: {formatVector(executionResult.vB)}
                </div>
              </div>

              <div className="result-box">
                <div className="result-box-label">Decrypted Outsource Result ({operation})</div>
                <div className="result-box-val">{formatVector(executionResult.decryptedResult)}</div>
              </div>
            </div>

            <div className="accuracy-bar">
              <span>Ground-Truth Verification:</span>
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

