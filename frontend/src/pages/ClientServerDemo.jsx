import React, { useState, useEffect } from 'react';
import VectorInput from '../components/VectorInput';
import OperationSelector from '../components/OperationSelector';
import ExecutionLogs from '../components/ExecutionLogs';
import ResultPanel from '../components/ResultPanel';
import { wasmService } from '../services/wasmService';
import { checkServerHealth, computeOutsource } from '../services/apiService';
import { parseVectorInput, computeExact, computeAccuracy, formatBytes } from '../utils/vectorUtils';

export default function ClientServerDemo() {
  const [vectorAStr, setVectorAStr] = useState('1.5, 2.0, 3.5, 4.0');
  const [vectorBStr, setVectorBStr] = useState('2.0, 3.0, 1.0, 2.0');
  const [operation, setOperation] = useState('multiply');

  const [serverStatus, setServerStatus] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const [isOutsourcing, setIsOutsourcing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isServerResultReady, setIsServerResultReady] = useState(false);

  const [serverEncryptedResult, setServerEncryptedResult] = useState(null);
  const [serverExecutionTime, setServerExecutionTime] = useState(null);
  const [payloadSizeStr, setPayloadSizeStr] = useState(null);
  const [activeVectorLength, setActiveVectorLength] = useState(0);

  const [logs, setLogs] = useState([]);
  const [decryptedResult, setDecryptedResult] = useState(null);
  const [expectedResult, setExpectedResult] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  // Check backend server status on mount
  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    const res = await checkServerHealth();
    setServerStatus(res);
  };

  const addLog = (msg) => {
    setLogs((prev) => [...prev, msg]);
  };

  const handleApplyPreset = (vA, vB) => {
    setVectorAStr(vA);
    setVectorBStr(vB);
    setValidationError(null);
    handleReset();
  };

  const handleReset = () => {
    setIsServerResultReady(false);
    setServerEncryptedResult(null);
    setServerExecutionTime(null);
    setPayloadSizeStr(null);
    setActiveVectorLength(0);
    setLogs([]);
    setDecryptedResult(null);
    setExpectedResult(null);
    setAccuracy(null);
  };

  const validateVectors = () => {
    try {
      const vA = parseVectorInput(vectorAStr);
      const vB = parseVectorInput(vectorBStr);

      if (vA.length === 0 || vB.length === 0) {
        setValidationError('Empty vectors are not allowed.');
        return null;
      }

      if (vA.length !== vB.length) {
        setValidationError(`Vectors must have equal lengths. Vector A has ${vA.length} elements, Vector B has ${vB.length}.`);
        return null;
      }

      setValidationError(null);
      return { vA, vB };
    } catch (err) {
      setValidationError(err.message);
      return null;
    }
  };

  /**
   * BUTTON 1: Encrypt & Outsource to Server
   * 1. Generates keys on client (Secret key stays in client WASM).
   * 2. Encrypts vectors into ciphertexts.
   * 3. Serializes ciphertexts.
   * 4. Sends HTTP POST /api/compute to Node.js server.
   * 5. Server evaluates without secret key and returns encrypted result.
   */
  const handleOutsource = async () => {
    const vectors = validateVectors();
    if (!vectors) return;

    setIsOutsourcing(true);
    setLogs([]);
    setDecryptedResult(null);
    setExpectedResult(null);
    setIsServerResultReady(false);

    try {
      // Step 1: Client key generation
      await wasmService.initializeCKKS();
      wasmService.generateClientKeys();
      addLog('[1] Client keys generated (Secret Key strictly retained in local WASM)');

      // Step 2 & 3: Encryption and Serialization
      const encryptedPayload = wasmService.encryptAndSerialize(
        vectors.vA,
        vectors.vB,
        operation
      );
      addLog('[2] Vectors encrypted using Client Public Key');

      const totalBytes =
        encryptedPayload.ciphertextA.length +
        encryptedPayload.ciphertextB.length +
        (encryptedPayload.relinKeys ? encryptedPayload.relinKeys.length : 0);
      const formattedSize = formatBytes(totalBytes);
      setPayloadSizeStr(formattedSize);
      setActiveVectorLength(encryptedPayload.vectorLength);

      addLog(`[3] Ciphertexts serialized (${formattedSize} Base64 payload)`);

      // Step 4: Network transmission to Node.js server
      addLog('[4] Sending request to server via POST /api/compute');
      const serverResponse = await computeOutsource({
        operation,
        ciphertextA: encryptedPayload.ciphertextA,
        ciphertextB: encryptedPayload.ciphertextB,
        relinKeys: encryptedPayload.relinKeys
      });

      // Step 5 & 6: Server computation logs
      addLog('[5] Server received encrypted payload (Zero plaintext visibility)');
      addLog(`[6] Homomorphic evaluation completed on server (${serverResponse.executionTimeMs} ms)`);

      // Step 7: Encrypted result received by client
      setServerEncryptedResult(serverResponse.encryptedResult);
      setServerExecutionTime(serverResponse.executionTimeMs);
      setIsServerResultReady(true);
      addLog('[7] Encrypted result received by client');
    } catch (err) {
      console.error(err);
      addLog(`[Error] ${err.message}`);
    } finally {
      setIsOutsourcing(false);
    }
  };

  /**
   * BUTTON 2: Decrypt & Reveal Result
   * Client decrypts the server's encrypted response using its local Secret Key.
   */
  const handleDecryptServerResult = async () => {
    const vectors = validateVectors();
    if (!vectors || !serverEncryptedResult) return;

    setIsDecrypting(true);

    try {
      const decrypted = wasmService.decryptSerializedResult(
        serverEncryptedResult,
        activeVectorLength
      );
      addLog('[8] Client decrypted result using private Secret Key');

      const exact = computeExact(vectors.vA, vectors.vB, operation);
      const acc = computeAccuracy(exact, decrypted);

      setDecryptedResult(decrypted);
      setExpectedResult(exact);
      setAccuracy(acc);
    } catch (err) {
      console.error(err);
      addLog(`[Error] Decryption failed: ${err.message}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Demo Header */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="px-2 py-0.5 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded">
            Demo 2
          </span>
          <span
            className={`px-2 py-0.5 text-[11px] font-semibold rounded border ${
              serverStatus?.online
                ? 'text-green-800 bg-green-100 border-green-300'
                : 'text-amber-800 bg-amber-100 border-amber-300'
            }`}
          >
            Server: {serverStatus === null ? 'Checking...' : serverStatus.online ? 'Online (Node.js)' : 'Offline'}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Client–Server CKKS</h2>
        <p className="text-sm text-gray-600 mt-1">
          Privacy-Preserving Computation: Demonstrate how encrypted data can be sent to a server for computation without revealing the original data. The server performs homomorphic arithmetic without the Secret Key.
        </p>
      </div>

      {serverStatus && !serverStatus.online && (
        <div className="p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between">
          <span>Backend evaluation server is offline at <code>/api</code>. Make sure <code>npm run server</code> or Docker container is active.</span>
          <button
            type="button"
            onClick={checkHealth}
            className="ml-3 px-2 py-1 text-[11px] font-medium bg-white border border-amber-300 rounded hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* Input Section */}
      <div className="p-6 bg-white border border-gray-200 rounded-lg space-y-5">
        <VectorInput
          vectorAStr={vectorAStr}
          setVectorAStr={(val) => {
            setVectorAStr(val);
            handleReset();
          }}
          vectorBStr={vectorBStr}
          setVectorBStr={(val) => {
            setVectorBStr(val);
            handleReset();
          }}
          onApplyPreset={handleApplyPreset}
          validationError={validationError}
        />

        <OperationSelector
          operation={operation}
          setOperation={(op) => {
            setOperation(op);
            handleReset();
          }}
          disabled={isOutsourcing || isDecrypting}
        />

        {/* Two Execution Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Button 1: Encrypt & Outsource */}
          <button
            type="button"
            onClick={handleOutsource}
            disabled={isOutsourcing || isDecrypting || (serverStatus && !serverStatus.online)}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isOutsourcing ? 'Outsourcing to Server...' : '1. Encrypt & Outsource'}
          </button>

          {/* Button 2: Decrypt & Reveal Result */}
          <button
            type="button"
            onClick={handleDecryptServerResult}
            disabled={!isServerResultReady || isOutsourcing || isDecrypting}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isDecrypting ? 'Decrypting...' : '2. Decrypt & Reveal Result'}
          </button>
        </div>

        {!isServerResultReady && (
          <p className="text-[11px] text-gray-400 text-center">
            * Button 2 remains disabled until the server returns the encrypted computation result.
          </p>
        )}
      </div>

      {/* Sequential Execution Logs */}
      <ExecutionLogs logs={logs} title="Client–Server Cryptographic Interaction Logs" />

      {/* Decrypted Results Panel with Zero-Knowledge Privacy Audit */}
      <ResultPanel
        decryptedResult={decryptedResult}
        expectedResult={expectedResult}
        operation={operation}
        accuracy={accuracy}
        executionTimeMs={serverExecutionTime}
        privacyAudit={
          payloadSizeStr
            ? {
                payloadSize: payloadSizeStr
              }
            : null
        }
      />
    </div>
  );
}

