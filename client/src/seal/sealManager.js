import SEAL from 'node-seal';

let sealInstance = null;
let sealContext = null;
let ckksEncoder = null;
let localEvaluator = null;

export const CKKS_PARAMS = {
  polyModulusDegree: 8192,
  bitSizes: [60, 40, 40, 60],
  scale: Math.pow(2, 40),
  scalePower: 40,
  slotCount: 4096,
  securityLevel: '128-bit (tc128)'
};

/**
 * Initializes Microsoft SEAL WebAssembly in the browser.
 */
export async function getClientSeal() {
  if (sealInstance && sealContext && ckksEncoder && localEvaluator) {
    return {
      seal: sealInstance,
      context: sealContext,
      encoder: ckksEncoder,
      evaluator: localEvaluator
    };
  }

  sealInstance = await SEAL();

  const schemeType = sealInstance.SchemeType.ckks;
  const securityLevel = sealInstance.SecLevelType.tc128;

  const parms = new sealInstance.EncryptionParameters(schemeType);
  parms.setPolyModulusDegree(CKKS_PARAMS.polyModulusDegree);
  parms.setCoeffModulus(
    sealInstance.CoeffModulus.Create(
      CKKS_PARAMS.polyModulusDegree,
      Int32Array.from(CKKS_PARAMS.bitSizes)
    )
  );

  sealContext = new sealInstance.SEALContext(parms, true, securityLevel);
  if (!sealContext.parametersSet()) {
    throw new Error('SEAL parameters are not valid for CKKS!');
  }

  ckksEncoder = new sealInstance.CKKSEncoder(sealContext);
  localEvaluator = new sealInstance.Evaluator(sealContext);

  return {
    seal: sealInstance,
    context: sealContext,
    encoder: ckksEncoder,
    evaluator: localEvaluator
  };
}

/**
 * Generates Secret Key, Public Key, and Relin Keys on the client.
 */
export function generateKeys(seal, context) {
  const keyGenerator = new seal.KeyGenerator(context);
  const secretKey = keyGenerator.secretKey();
  const publicKey = keyGenerator.createPublicKey();
  const relinKeys = keyGenerator.createRelinKeys();

  return {
    secretKey,
    publicKey,
    relinKeys
  };
}

/**
 * Encodes a numeric array into a CKKS Plaintext polynomial.
 */
export function encodeVector(seal, encoder, numbers) {
  const plain = new seal.Plaintext();
  const floatArray = Float64Array.from(numbers);
  encoder.encode(floatArray, CKKS_PARAMS.scale, plain);
  return plain;
}

/**
 * Encrypts a Plaintext polynomial using the Public Key.
 */
export function encryptPlaintext(seal, context, publicKey, plain) {
  const cipher = new seal.Ciphertext();
  const encryptor = new seal.Encryptor(context, publicKey);
  encryptor.encrypt(plain, cipher);
  return cipher;
}

/**
 * Evaluates homomorphic addition or multiplication locally (Demo 1).
 */
export function evaluateLocal(seal, evaluator, operation, cipherA, cipherB, relinKeys) {
  const cipherRes = new seal.Ciphertext();

  if (operation === 'add') {
    evaluator.add(cipherA, cipherB, cipherRes);
  } else if (operation === 'multiply') {
    if (!relinKeys) {
      throw new Error('Relinearization keys are required for multiplication.');
    }
    evaluator.multiply(cipherA, cipherB, cipherRes);
    evaluator.relinearize(cipherRes, relinKeys, cipherRes);
    evaluator.rescaleToNext(cipherRes, cipherRes);
  } else {
    throw new Error(`Unsupported operation: ${operation}`);
  }

  return cipherRes;
}

/**
 * Decrypts a Ciphertext using the local Secret Key and decodes into numbers.
 */
export function decryptAndDecode(seal, context, secretKey, encoder, cipher, length) {
  const plain = new seal.Plaintext();
  const decryptor = new seal.Decryptor(context, secretKey);
  decryptor.decrypt(cipher, plain);
  const decoded = encoder.decodeFloat64(plain);
  return Array.from(decoded.slice(0, length));
}

/**
 * Serializes a Ciphertext to base64 with zlib compression for network transfer.
 */
export function serializeCiphertext(seal, cipher) {
  return cipher.saveToBase64(seal.ComprModeType.zlib);
}

/**
 * Deserializes a Ciphertext from base64 string.
 */
export function deserializeCiphertext(seal, context, base64) {
  const cipher = new seal.Ciphertext();
  cipher.loadFromBase64(context, base64);
  return cipher;
}

/**
 * Serializes Relinearization Keys to base64 with zlib compression.
 */
export function serializeRelinKeys(seal, relinKeys) {
  return relinKeys.saveToBase64(seal.ComprModeType.zlib);
}

