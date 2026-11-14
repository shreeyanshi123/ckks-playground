import React, { useState } from 'react';
import VectorInput from '../components/VectorInput';
import OperationSelector from '../components/OperationSelector';
import ExecutionLogs from '../components/ExecutionLogs';
import ResultPanel from '../components/ResultPanel';
import { wasmService } from '../services/wasmService';
import { parseVectorInput, computeExact, computeAccuracy } from '../utils/vectorUtils';

export default function CKKSBasics() {
  const [vectorAStr, setVectorAStr] = useState('1.5, 2.0, 3.5, 4.0');
  const [vectorBStr, setVectorBStr] = useState('2.0, 3.0, 1.0, 2.0');
  const [operation, setOperation] = useState('add');

  const [isComputing, setIsComputing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [isComputed, setIsComputed] = useState(false);

  const [validationError, setValidationError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [decryptedResult, setDecryptedResult] = useState(null);
  const [expectedResult, setExpectedResult] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [executionTimeMs, setExecutionTimeMs] = useState(null);

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
    wasmService.resetDemo();
    setIsComputed(false);
    setLogs([]);
    setDecryptedResult(null);
    setExpectedResult(null);
    setAccuracy(null);
    setExecutionTimeMs(null);
  };

  /**
   * Validates vector inputs per prompt requirements:
   * - Both vectors must contain valid numbers.
   * - Both vectors must have equal lengths.
   * - Empty vectors are not allowed.
   */
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
   * BUTTON 1: Encrypt & Compute
   * Encodes, encrypts, and evaluates on ciphertexts.
   * Retains computed ciphertext and secret key in WASM runtime.
   */
  const handleEncryptAndCompute = async () => {
    const vectors = validateVectors();
    if (!vectors) return;

    setIsComputing(true);
    setLogs([]);
    setDecryptedResult(null);
    setExpectedResult(null);
    setIsComputed(false);

    const startTime = performance.now();

    try {
      const result = await wasmService.encryptAndCompute(
        vectors.vA,
        vectors.vB,
        operation,
        addLog
      );

      if (result.success) {
        setIsComputed(true);
      }
    } catch (err) {
      console.error(err);
      addLog(`[Error] ${err.message}`);
    } finally {
      setIsComputing(false);
    }
  };

  /**
   * BUTTON 2: Decrypt & Reveal
   * Uses retained secret key to decrypt retained ciphertext and decode to floats.
   */
  const handleDecryptAndReveal = async () => {
    const vectors = validateVectors();
    if (!vectors) return;

    setIsDecrypting(true);
    const startTime = performance.now();

    try {
      const result = await wasmService.decryptResult(addLog);
      const timeMs = (performance.now() - startTime).toFixed(1);

      if (result.success) {
        const exact = computeExact(vectors.vA, vectors.vB, operation);
        const acc = computeAccuracy(exact, result.data);

        setDecryptedResult(result.data);
        setExpectedResult(exact);
        setAccuracy(acc);
        setExecutionTimeMs(timeMs);
      }
    } catch (err) {
      console.error(err);
      addLog(`[Error] ${err.message}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Demo Header */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <span className="px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded">
            Demo 1
          </span>
          <span className="px-2 py-0.5 text-[11px] font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded">
            100% In-Browser WASM
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">CKKS Basics</h2>
        <p className="text-sm text-gray-600 mt-1">
          Understand Homomorphic Encryption: Execute the complete CKKS cryptographic workflow locally inside the browser using WebAssembly. No backend or server communication is involved.
        </p>
      </div>

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
          disabled={isComputing || isDecrypting}
        />

        {/* Two Execution Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Button 1: Encrypt & Compute */}
          <button
            type="button"
            onClick={handleEncryptAndCompute}
            disabled={isComputing || isDecrypting}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isComputing ? 'Encrypting & Computing...' : '1. Encrypt & Compute'}
          </button>

          {/* Button 2: Decrypt & Reveal */}
          <button
            type="button"
            onClick={handleDecryptAndReveal}
            disabled={!isComputed || isComputing || isDecrypting}
            className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isDecrypting ? 'Decrypting...' : '2. Decrypt & Reveal'}
          </button>
        </div>

        {!isComputed && (
          <p className="text-[11px] text-gray-400 text-center">
            * Button 2 remains disabled until Button 1 evaluates ciphertexts inside the WASM runtime.
          </p>
        )}
      </div>

      {/* Sequential Execution Logs */}
      <ExecutionLogs logs={logs} title="CKKS Basics Execution Trace" />

      {/* Decrypted Results Panel */}
      <ResultPanel
        decryptedResult={decryptedResult}
        expectedResult={expectedResult}
        operation={operation}
        accuracy={accuracy}
        executionTimeMs={executionTimeMs}
      />
    </div>
  );
}
