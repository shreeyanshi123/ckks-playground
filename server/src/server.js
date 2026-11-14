import express from 'express';
import cors from 'cors';
import { initServerSeal, evaluateCiphertexts, CKKS_CONFIG } from './ckksEvaluator.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Allow cross-origin requests from frontend
app.use(cors());

// Parse JSON bodies up to 50MB for serialized SEAL ciphertexts & evaluation keys
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { seal } = await initServerSeal();
    res.json({
      status: 'online',
      message: 'CKKS Homomorphic Evaluation Server is running',
      backend: 'Node.js + Microsoft SEAL (WASM)',
      ckksConfig: CKKS_CONFIG
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Outsourced Homomorphic Evaluation endpoint
app.post('/api/evaluate', async (req, res) => {
  try {
    const { operation, ciphertextA, ciphertextB, relinKeys } = req.body;

    if (!operation || !ciphertextA || !ciphertextB) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: operation, ciphertextA, and ciphertextB are required.'
      });
    }

    if (operation === 'multiply' && !relinKeys) {
      return res.status(400).json({
        success: false,
        error: 'RelinKeys are required for multiplication.'
      });
    }

    const result = await evaluateCiphertexts({
      operation,
      ciphertextA,
      ciphertextB,
      relinKeys
    });

    res.json(result);
  } catch (err) {
    console.error('[Server Error in /api/evaluate]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Homomorphic evaluation failed on server'
    });
  }
});

// Warm up SEAL on boot
initServerSeal()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(` Microsoft SEAL CKKS Evaluation Server listening on port ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
      console.log(` Evaluate:     POST http://localhost:${PORT}/api/evaluate`);
      console.log(`=======================================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize server SEAL:', err);
    process.exit(1);
  });

