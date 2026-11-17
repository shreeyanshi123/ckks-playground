import SEAL from 'node-seal';

/**
 * Encapsulates the Microsoft SEAL WebAssembly runtime state.
 *
 * CRITICAL SECURITY & CRYPTOGRAPHIC REQUIREMENT:
 * - Secret keys and intermediate ciphertexts are retained within the WASM service memory.
 * - Secret keys are never serialized to localStorage, sessionStorage, or exposed to React state.
 */
class CKKSWasmService {
  constructor() {
    this.seal = null;
    this.context = null;
    this.encoder = null;
    this.evaluator = null;

    // In-memory retention between Button 1 and Button 2 (Demo 1)
    this.demo1SecretKey = null;
    this.demo1RetainedCiphertext = null;
    this.demo1VectorLength = 0;
    this.isDemo1Computed = false;

    // In-memory retention for Client-Server (Demo 2)
    this.demo2SecretKey = null;
    this.demo2PublicKey = null;
    this.demo2RelinKeys = null;

    this.isInitialized = false;

    // Parameters matching standard 128-bit CKKS with visible approximation
    this.params = {
      polyModulusDegree: 8192,
      bitSizes: [60, 30, 30, 60],
      scale: Math.pow(2, 30),
      scalePower: 30,
      slotCount: 4096,
      securityLevel: '128-bit (tc128)'
    };
  }

  /**
   * Initializes the Microsoft SEAL WebAssembly runtime and CKKS context.
   */
  async initializeCKKS() {
    if (this.isInitialized && this.seal && this.context) {
      return { success: true, params: this.params };
    }

    this.seal = await SEAL({
      locateFile: (file) => {
        if (file.endsWith('.wasm')) {
          return '/wasm/ckks.wasm';
        }
        return `/wasm/${file}`;
      }
    });

    const schemeType = this.seal.SchemeType.ckks;
    const securityLevel = this.seal.SecLevelType.tc128;

    const parms = new this.seal.EncryptionParameters(schemeType);
    parms.setPolyModulusDegree(this.params.polyModulusDegree);
    parms.setCoeffModulus(
      this.seal.CoeffModulus.Create(
        this.params.polyModulusDegree,
        Int32Array.from(this.params.bitSizes)
      )
    );

    this.context = new this.seal.SEALContext(parms, true, securityLevel);
    if (!this.context.parametersSet()) {
      throw new Error('SEALContext initialization failed: Invalid CKKS parameters.');
    }

    this.encoder = new this.seal.CKKSEncoder(this.context);
    this.evaluator = new this.seal.Evaluator(this.context);
    this.isInitialized = true;

    return { success: true, params: this.params };
  }

  /**
   * DEMO 1 - BUTTON 1: Encrypt & Compute
   * Encodes, encrypts, and performs homomorphic operation on ciphertexts.
   * Retains the final ciphertext and secret key in WASM runtime memory.
   */
  async encryptAndCompute(vectorA, vectorB, operation, onStepLog) {
    if (!this.isInitialized) {
      await this.initializeCKKS();
    }

    if (onStepLog) onStepLog('[1] WASM module initialized');
    if (onStepLog) onStepLog(`[2] CKKS parameters configured (N=${this.params.polyModulusDegree}, scale=2^${this.params.scalePower})`);

    // Key generation
    const keyGen = new this.seal.KeyGenerator(this.context);
    this.demo1SecretKey = keyGen.secretKey();
    const publicKey = keyGen.createPublicKey();
    let relinKeys = null;

    if (operation === 'multiply') {
      relinKeys = keyGen.createRelinKeys();
    }
    if (onStepLog) onStepLog('[3] Key generation completed');

    const len = Math.min(vectorA.length, vectorB.length);
    this.demo1VectorLength = len;

    // Plaintext encoding
    const plainA = new this.seal.Plaintext();
    const plainB = new this.seal.Plaintext();
    this.encoder.encode(Float64Array.from(vectorA.slice(0, len)), this.params.scale, plainA);
    this.encoder.encode(Float64Array.from(vectorB.slice(0, len)), this.params.scale, plainB);
    if (onStepLog) onStepLog('[4] Vectors encoded into plaintext polynomials');

    // Ciphertext encryption
    const encryptor = new this.seal.Encryptor(this.context, publicKey);
    const cipherA = new this.seal.Ciphertext();
    const cipherB = new this.seal.Ciphertext();
    encryptor.encrypt(plainA, cipherA);
    encryptor.encrypt(plainB, cipherB);
    if (onStepLog) onStepLog('[5] Encryption completed with Public Key');

    // Homomorphic evaluation on ciphertexts
    this.demo1RetainedCiphertext = new this.seal.Ciphertext();

    if (operation === 'add') {
      this.evaluator.add(cipherA, cipherB, this.demo1RetainedCiphertext);
    } else if (operation === 'multiply') {
      this.evaluator.multiply(cipherA, cipherB, this.demo1RetainedCiphertext);
      this.evaluator.relinearize(this.demo1RetainedCiphertext, relinKeys, this.demo1RetainedCiphertext);
      this.evaluator.rescaleToNext(this.demo1RetainedCiphertext, this.demo1RetainedCiphertext);
    } else {
      throw new Error(`Unsupported operation: ${operation}`);
    }

    this.isDemo1Computed = true;
    if (onStepLog) onStepLog('[6] Homomorphic computation completed');
    if (onStepLog) onStepLog('[7] Ready for decryption');

    return {
      success: true,
      operation,
      vectorLength: len,
      isReadyForDecryption: true
    };
  }

  /**
   * DEMO 1 - BUTTON 2: Decrypt & Reveal
   * Uses retained secret key to decrypt retained ciphertext and decodes back to numbers.
   */
  async decryptResult(onStepLog) {
    if (!this.isDemo1Computed || !this.demo1RetainedCiphertext || !this.demo1SecretKey) {
      throw new Error('No retained ciphertext found in WASM runtime. Run Encrypt & Compute first.');
    }

    if (onStepLog) onStepLog('[8] Ciphertext retrieved from WASM runtime');

    const decryptor = new this.seal.Decryptor(this.context, this.demo1SecretKey);
    const plainResult = new this.seal.Plaintext();
    decryptor.decrypt(this.demo1RetainedCiphertext, plainResult);
    if (onStepLog) onStepLog('[9] Decryption completed using retained secret key');

    const decoded = this.encoder.decodeFloat64(plainResult);
    if (onStepLog) onStepLog('[10] Plaintext decoded to floating-point vector');

    const result = Array.from(decoded.slice(0, this.demo1VectorLength));

    return {
      success: true,
      data: result
    };
  }

  /**
   * Resets Demo 1 in-memory state.
   */
  resetDemo() {
    this.demo1RetainedCiphertext = null;
    this.demo1SecretKey = null;
    this.demo1VectorLength = 0;
    this.isDemo1Computed = false;
  }

  // -------------------------------------------------------------
  // DEMO 2 HELPER METHODS (Client side of Client-Server)
  // -------------------------------------------------------------

  /**
   * DEMO 2: Client generates and retains keys locally.
   */
  generateClientKeys() {
    const keyGen = new this.seal.KeyGenerator(this.context);
    this.demo2SecretKey = keyGen.secretKey();
    this.demo2PublicKey = keyGen.createPublicKey();
    this.demo2RelinKeys = keyGen.createRelinKeys();
    return { success: true };
  }

  /**
   * DEMO 2: Client encodes and encrypts private vectors into Base64 ciphertexts.
   */
  encryptAndSerialize(vectorA, vectorB, operation) {
    const len = Math.min(vectorA.length, vectorB.length);

    const plainA = new this.seal.Plaintext();
    const plainB = new this.seal.Plaintext();
    this.encoder.encode(Float64Array.from(vectorA.slice(0, len)), this.params.scale, plainA);
    this.encoder.encode(Float64Array.from(vectorB.slice(0, len)), this.params.scale, plainB);

    const encryptor = new this.seal.Encryptor(this.context, this.demo2PublicKey);
    const cipherA = new this.seal.Ciphertext();
    const cipherB = new this.seal.Ciphertext();
    encryptor.encrypt(plainA, cipherA);
    encryptor.encrypt(plainB, cipherB);

    const b64CipherA = cipherA.saveToBase64(this.seal.ComprModeType.zlib);
    const b64CipherB = cipherB.saveToBase64(this.seal.ComprModeType.zlib);

    let b64RelinKeys = null;
    if (operation === 'multiply') {
      b64RelinKeys = this.demo2RelinKeys.saveToBase64(this.seal.ComprModeType.zlib);
    }

    return {
      ciphertextA: b64CipherA,
      ciphertextB: b64CipherB,
      relinKeys: b64RelinKeys,
      vectorLength: len
    };
  }

  /**
   * DEMO 2: Client decrypts the server's returned Base64 ciphertext with its local Secret Key.
   */
  decryptSerializedResult(b64Result, vectorLength) {
    const resultCipher = new this.seal.Ciphertext();
    resultCipher.loadFromBase64(this.context, b64Result);

    const decryptor = new this.seal.Decryptor(this.context, this.demo2SecretKey);
    const plainResult = new this.seal.Plaintext();
    decryptor.decrypt(resultCipher, plainResult);

    const decoded = this.encoder.decodeFloat64(plainResult);
    return Array.from(decoded.slice(0, vectorLength));
  }
}

// Singleton instance
export const wasmService = new CKKSWasmService();
export default wasmService;

