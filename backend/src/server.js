import express from 'express';
import cors from 'cors';
import computeRoutes from './routes/compute.js';
import { initServerSeal, CKKS_CONFIG } from './services/ckksEvaluator.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  try {
    const { seal } = await initServerSeal();
    res.json({
      status: 'online',
      message: 'Microsoft SEAL CKKS Homomorphic Evaluator Server is running',
      backend: 'Node.js + Microsoft SEAL (WASM / C++)',
      ckksConfig: CKKS_CONFIG
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Mount Compute Routes
app.use('/api', computeRoutes);

// Initialize SEAL on startup
initServerSeal()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(` Microsoft SEAL CKKS Evaluation Server listening on port ${PORT}`);
      console.log(` Health check: GET  http://localhost:${PORT}/api/health`);
      console.log(` Compute API:  POST http://localhost:${PORT}/api/compute`);
      console.log(`=======================================================`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize server SEAL:', err);
    process.exit(1);
  });
