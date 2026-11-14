import express from 'express';
import { evaluateCiphertexts } from '../services/ckksEvaluator.js';

const router = express.Router();

/**
 * POST /api/compute
 * Performs homomorphic computation without possessing the client's secret key.
 */
router.post('/compute', async (req, res) => {
  try {
    const { operation, ciphertextA, ciphertextB, relinKeys } = req.body;

    if (!operation || !ciphertextA || !ciphertextB) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: operation, ciphertextA, and ciphertextB are required.'
      });
    }

    if (operation !== 'add' && operation !== 'multiply') {
      return res.status(400).json({
        success: false,
        error: `Invalid operation: '${operation}'. Must be 'add' or 'multiply'.`
      });
    }

    if (operation === 'multiply' && !relinKeys) {
      return res.status(400).json({
        success: false,
        error: 'Relinearization keys (relinKeys) are required for homomorphic multiplication on the server.'
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
    console.error('[Compute Route Error]:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Homomorphic evaluation failed on server.'
    });
  }
});

// Alias for evaluate
router.post('/evaluate', async (req, res) => {
  req.url = '/compute';
  return router.handle(req, res);
});

export default router;
