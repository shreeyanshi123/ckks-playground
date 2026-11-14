#!/usr/bin/env bash
set -euo pipefail

# Build script for Microsoft SEAL WebAssembly using Emscripten
echo "=========================================================="
echo " Building Microsoft SEAL WebAssembly with Emscripten SDK"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BUILD_DIR="$ROOT_DIR/cpp/build"
OUTPUT_DIR="$ROOT_DIR/frontend/public/wasm"

mkdir -p "$BUILD_DIR"
mkdir -p "$OUTPUT_DIR"

if ! command -v emcmake &> /dev/null; then
    echo "Warning: emcmake (Emscripten) not found in PATH."
    echo "To compile from source, install emsdk and run 'source emsdk_env.sh'."
    echo "Using precompiled/node-seal WebAssembly distribution."
    exit 0
fi

echo "Configuring C++ CKKS with emcmake..."
cd "$BUILD_DIR"
emcmake cmake ../client -DCMAKE_BUILD_TYPE=Release
cmake --build .

echo "Copying generated WASM and JS glue code to frontend..."
cp ckks.js "$OUTPUT_DIR/"
cp ckks.wasm "$OUTPUT_DIR/"

echo "WASM compilation complete: ckks.js and ckks.wasm generated."

