#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " Building and Verifying CKKS Node.js Server"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR/backend"
echo "Installing backend dependencies..."
npm install

echo "Testing server execution..."
node --experimental-wasm-exnref -e "import('./src/services/ckksEvaluator.js').then(m => m.initServerSeal().then(() => console.log('Backend SEAL initialized successfully.')))"

echo "Backend build verified successfully."
