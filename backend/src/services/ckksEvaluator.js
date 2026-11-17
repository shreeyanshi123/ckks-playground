import SEAL from 'node-seal';

let sealInstance = null;
let sealContext = null;
let evaluator = null;

export const CKKS_CONFIG = {
  polyModulusDegree: 8192,
  bitSizes: [60, 30, 30, 60],
  scalePower: 30,
  securityLevel: '128-bit (tc128)'
};

/**
 * Initializes Microsoft SEAL and the CKKS context on the server.
 */
export async function initServerSeal() {
  if (sealContext && evaluator) {
    return { seal: sealInstance, context: sealContext, evaluator };
  }

  console.log('[Server SEAL] Initializing Microsoft SEAL WebAssembly...');
  sealInstance = await SEAL();

  const schemeType = sealInstance.SchemeType.ckks;
  const securityLevel = sealInstance.SecLevelType.tc128;
  const parms = new sealInstance.EncryptionParameters(schemeType);

  parms.setPolyModulusDegree(CKKS_CONFIG.polyModulusDegree);
  parms.setCoeffModulus(
    sealInstance.CoeffModulus.Create(
      CKKS_CONFIG.polyModulusDegree,
      Int32Array.from(CKKS_CONFIG.bitSizes)
    )
  );

  sealContext = new sealInstance.SEALContext(parms, true, securityLevel);

  if (!sealContext.parametersSet()) {
    throw new Error('[Server SEAL] Invalid CKKS encryption parameters!');
  }

  evaluator = new sealInstance.Evaluator(sealContext);
  console.log('[Server SEAL] Evaluator ready. Parameters set successfully.');

  return { seal: sealInstance, context: sealContext, evaluator };
}

/**
 * Executes homomorphic addition or multiplication on encrypted data.
 * Notice: The server does NOT possess or use the secret key!
 */
export async function evaluateCiphertexts({ operation, ciphertextA, ciphertextB, relinKeys }) {
  const { seal, context, evaluator } = await initServerSeal();
  const startTime = performance.now();
  const serverLogs = [];

  serverLogs.push('Received encrypted payload from client. (No private data visible to server)');

  // 1. Deserialize Ciphertext A
  const cA = new seal.Ciphertext();
  try {
    cA.loadFromBase64(context, ciphertextA);
    serverLogs.push(`Deserialized Ciphertext A (modulus level: ${cA.coeffModulusSize}, scale: 2^${Math.round(Math.log2(cA.scale))})`);
  } catch (err) {
    throw new Error(`Failed to deserialize Ciphertext A: ${err.message}`);
  }

  // 2. Deserialize Ciphertext B
  const cB = new seal.Ciphertext();
  try {
    cB.loadFromBase64(context, ciphertextB);
    serverLogs.push(`Deserialized Ciphertext B (modulus level: ${cB.coeffModulusSize}, scale: 2^${Math.round(Math.log2(cB.scale))})`);
  } catch (err) {
    throw new Error(`Failed to deserialize Ciphertext B: ${err.message}`);
  }

  const cRes = new seal.Ciphertext();

  if (operation === 'add') {
    serverLogs.push('Performing homomorphic addition: cRes = cA + cB');
    evaluator.add(cA, cB, cRes);
    serverLogs.push('Addition completed in ciphertext space without decryption.');
  } else if (operation === 'multiply') {
    if (!relinKeys) {
      throw new Error('RelinKeys are required for homomorphic multiplication on the server.');
    }

    serverLogs.push('Deserializing client Relinearization Keys...');
    const rk = new seal.RelinKeys();
    rk.loadFromBase64(context, relinKeys);
    serverLogs.push('RelinKeys loaded successfully.');

    serverLogs.push('Performing homomorphic tensor multiplication: cRes = cA * cB');
    evaluator.multiply(cA, cB, cRes);

    serverLogs.push('Performing relinearization (reducing ciphertext size back to 2 polynomials)...');
    evaluator.relinearize(cRes, rk, cRes);

    serverLogs.push('Performing rescaling to next modulus level (controlling scale growth)...');
    evaluator.rescaleToNext(cRes, cRes);

    serverLogs.push(`Multiplication completed. Result modulus level: ${cRes.coeffModulusSize}`);
  } else {
    throw new Error(`Unsupported operation: ${operation}. Allowed operations: 'add', 'multiply'`);
  }

  // 3. Serialize encrypted result
  const serializedResult = cRes.saveToBase64(seal.ComprModeType.zlib);
  const endTime = performance.now();
  const executionTimeMs = (endTime - startTime).toFixed(2);

  serverLogs.push(`Serialized encrypted result (${serializedResult.length} base64 chars). Returning to client.`);

  return {
    success: true,
    operation,
    encryptedResult: serializedResult,
    executionTimeMs: Number(executionTimeMs),
    serverLogs,
    resultModulusSize: cRes.coeffModulusSize,
    resultScalePower: Math.round(Math.log2(cRes.scale))
  };
}

