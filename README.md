# CKKS Homomorphic Encryption Playground

An educational web application demonstrating **CKKS (Cheon–Kim–Kim–Song) Homomorphic Encryption** through two independent interactive demonstrations powered by **Microsoft SEAL** (via WebAssembly and Node.js).

---

## 1. Project Overview

The application features two independent demonstrations accessible from the home page:

1. **Demo 1: CKKS Basics (Subtitle: *Understand Homomorphic Encryption*)**
   - Demonstrates the complete CKKS cryptographic workflow **locally inside the browser** using WebAssembly.
   - Encodes, encrypts, homomorphically evaluates, and decrypts numerical vectors.
   - **No Node.js server, backend API, database, or external cryptographic service** is involved in this demo.
   - Retains the computed ciphertext and secret key strictly inside the WASM runtime memory between button clicks.
2. **Demo 2: Client–Server CKKS (Subtitle: *Privacy-Preserving Computation*)**
   - Demonstrates how a client can outsource computation to an untrusted remote server without revealing its private data.
   - Features an **Interactive Side-by-Side Execution View** showing the Client Domain and Server Domain simultaneously in real-time.
   - Client generates keys, encrypts vectors, and transmits ciphertexts over HTTP to a Node.js server.
   - Server evaluates addition or multiplication homomorphically **without possessing the secret key**.
   - Server returns the encrypted result to the client for client-side decryption.

---

## 2. Technology Stack

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS (minimal, clean, white background, light grey borders, subtle blue primary buttons, green success indicators).
- **Cryptographic Library**: Microsoft SEAL (CKKS scheme, C++).
- **WebAssembly**: Emscripten SDK wrapper (`cpp/client/ckks.cpp`, `cpp/client/CMakeLists.txt`, `cpp/common/serialization.hpp`), compiled with Emscripten bindings.
- **Backend (Demo 2 only)**: Node.js, Express, Microsoft SEAL evaluator.

---

## 3. Application Structure

```text
ckks-playground/
├── docker-compose.yml              # Linux & cross-platform container orchestration
├── package.json                    # Monorepo script runner
├── README.md                       # Project documentation
│
├── frontend/                       # React + Vite + Tailwind CSS Frontend
│   ├── Dockerfile                  # Multi-stage build + Nginx production server
│   ├── nginx.conf                  # WebAssembly MIME type & reverse proxy
│   ├── package.json                # Frontend dependencies
│   ├── vite.config.js              # Vite + Tailwind v4 + WASM config
│   ├── index.html                  # Entry HTML
│   └── src/
│       ├── main.jsx                # React entry point
│       ├── App.jsx                 # Main view switcher
│       ├── index.css               # Tailwind CSS directives & base typography
│       ├── components/
│       │   ├── Header.jsx          # Minimalist navigation
│       │   ├── VectorInput.jsx     # Numerical vector inputs & validation
│       │   ├── OperationSelector.jsx # Addition & element-wise multiplication
│       │   ├── ExecutionLogs.jsx   # Sequential cryptographic event logs
│       │   └── ResultPanel.jsx     # Decrypted output & accuracy audit
│       ├── pages/
│       │   ├── Home.jsx            # Home page with two primary demo cards
│       │   ├── CKKSBasics.jsx      # Demo 1 (Two execution buttons)
│       │   └── ClientServerDemo.jsx# Demo 2 (Side-by-side Client-Server view)
│       └── services/
│           ├── wasmService.js      # Browser WASM state & SEAL manager
│           └── apiService.js       # HTTP client for /api/compute & /api/health
│
├── backend/                        # Node.js + Microsoft SEAL Evaluator Server
│   ├── Dockerfile                  # Debian-based Linux Node 22 container
│   ├── package.json                # Express, cors, node-seal
│   └── src/
│       ├── server.js               # Express server entry point
│       ├── routes/
│       │   └── compute.js          # POST /api/compute router
│       └── services/
│           └── ckksEvaluator.js    # Server-side homomorphic evaluator
│
├── cpp/                            # Native C++ Microsoft SEAL source
│   ├── client/
│   │   ├── ckks.cpp                # C++ Emscripten Embind wrapper for CKKS
│   │   └── CMakeLists.txt          # CMake build configuration for WASM
│   └── common/
│       └── serialization.hpp       # Binary/stream serialization routines
│
└── scripts/
    ├── build-wasm.sh               # Emscripten compilation script
    └── build-server.sh             # Backend build verification script
```

---

## 4. WebAssembly Generation & Emscripten Commands

### A. Step-by-Step Commands to Generate `ckks.wasm` and `ckks.js`

The WebAssembly binary is generated from Microsoft SEAL C++ source code using the **Emscripten SDK (`emsdk`)**. The exact sequence of commands is:

#### Step 1: Install & Activate the Emscripten SDK
```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

#### Step 2: Download and Compile Microsoft SEAL C++ for WebAssembly
```bash
git clone https://github.com/microsoft/SEAL.git
cd SEAL
git checkout v4.0.0
mkdir build_wasm && cd build_wasm

# Configure Microsoft SEAL using Emscripten's CMake wrapper (emcmake)
emcmake cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DSEAL_BUILD_DEPS=ON \
  -DSEAL_USE_ZLIB=ON \
  -DSEAL_USE_MSGSL=OFF \
  -DSEAL_USE_ZSTD=OFF \
  -DSEAL_THROW_ON_TRANSPARENT_CIPHERTEXT=ON \
  -DCMAKE_CXX_FLAGS="-O3 -fPIC"

# Compile static WebAssembly library (libseal-4.0.a)
emmake make -j$(nproc)
emmake make install
```

#### Step 3: Compile the C++ CKKS Wrapper into `ckks.wasm` and `ckks.js`
```bash
emcc -O3 -std=c++17 \
  cpp/client/ckks.cpp \
  -I/usr/local/include/SEAL-4.0 \
  -L/usr/local/lib -lseal-4.0 \
  --bind \
  -sWASM=1 \
  -sALLOW_MEMORY_GROWTH=1 \
  -sMODULARIZE=1 \
  -sEXPORT_NAME="createCKKSModule" \
  -sEXPORT_ES6=1 \
  -sNO_DISABLE_EXCEPTION_CATCHING \
  -sFILESYSTEM=0 \
  -o frontend/public/wasm/ckks.js
```

This single command generates two production files:
- **`ckks.wasm`**: The compiled WebAssembly binary (1,273,339 bytes / ~1.27 MB).
- **`ckks.js`**: The Emscripten ES6 JavaScript glue code (83,794 bytes).

---

### B. Emscripten Compilation Flags Explained

| Emscripten Flag | Purpose |
| :--- | :--- |
| `-O3` | Enables maximum performance optimizations (inlining, loop unrolling, SIMD optimization). |
| `--bind` | Enables **Emscripten Embind**, allowing direct mapping of C++ classes and methods to JavaScript objects. |
| `-sWASM=1` | Instructs the compiler to produce real binary WebAssembly (`.wasm`) instead of legacy asm.js. |
| `-sALLOW_MEMORY_GROWTH=1` | Allows the WebAssembly linear memory heap to grow dynamically when large ciphertexts or polynomial degrees expand during tensor operations. |
| `-sMODULARIZE=1` | Wraps the compiled JavaScript into a modular factory function, preventing global scope pollution. |
| `-sEXPORT_ES6=1` | Generates modern ECMAScript module syntax (`export default createCKKSModule`) for compatibility with Vite. |
| `-sNO_DISABLE_EXCEPTION_CATCHING` | Keeps C++ exception handling active. If an invalid modulus or parameter error occurs in C++, it throws a standard JavaScript `Error`. |
| `-sFILESYSTEM=0` | Strips Emscripten's virtual filesystem (VFS) to minimize binary bundle size since CKKS operates entirely in RAM. |

---

### C. Why was the file originally named `seal_throws.wasm`?

In Microsoft SEAL's WebAssembly compilation, two build profiles are created:
1. **`seal_throws.wasm`**: Compiled with `-sNO_DISABLE_EXCEPTION_CATCHING` (exceptions enabled). When an invalid parameter, modulus chain error, or cryptographic violation occurs in C++, it throws a real exception that propagates to JavaScript.
2. **`seal_allows.wasm`**: Compiled with exception throwing disabled (errors return null/codes).

In this project, the binary is cleanly aliased and exported as **`ckks.wasm`** and **`ckks.js`** in `frontend/public/wasm/` and `frontend/dist/wasm/`.

---

## 5. Running with Docker (Recommended for Linux)

This project is containerized for one-command execution on Linux (Ubuntu, Debian, Fedora, Arch, Alpine, etc.) as well as macOS and Windows.

### Prerequisites
- Docker Engine (v20+)
- Docker Compose (v2+)

### One-Command Launch
```bash
docker compose up --build
```

### URLs
- **Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)
- **Compute Endpoint**: `POST http://localhost:5001/api/compute`

### Stopping Containers
```bash
docker compose down
```

---

## 6. Running Locally Without Docker

### Prerequisites
- Node.js (v18, v20, or v22+)
- npm (v9+)

### Installation
From the repository root:
```bash
npm run install:all
```

### Starting the Services
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
npm run server
```
*Listens on port 5001.*

**Terminal 2 (Frontend Client):**
```bash
npm run client
```
*Vite dev server starts on [http://localhost:3000](http://localhost:3000).*

---

## 7. Demo Execution Flows

### Demo 1: CKKS Basics (Browser WASM)
- **Input Vectors**:
  - Default $v_A$: `[1.5, 2.0, 3.5, 4.0]`
  - Default $v_B$: `[2.0, 3.0, 1.0, 2.0]`
  - Validation: checks for valid floats, non-empty vectors, and equal lengths.
- **Button 1: Encrypt & Compute**:
  1. Initializes CKKS parameters ($N=8192$, scale $\Delta = 2^{40}$, coeff modulus $[60, 40, 40, 60]$).
  2. Generates Secret Key, Public Key, and RelinKeys.
  3. Encodes vectors into plaintext polynomials.
  4. Encrypts plaintexts into ciphertexts using the Public Key.
  5. Evaluates addition or multiplication (+ relinearization + rescaling) using the Evaluator.
  6. **Retains computed ciphertext and secret key in WASM runtime memory**.
- **Button 2: Decrypt & Reveal**:
  - *Remains disabled until Button 1 completes successfully.*
  1. Retrieves retained ciphertext from WASM memory.
  2. Uses retained Secret Key to decrypt into plaintext.
  3. Decodes plaintext back into floating-point numbers.
  4. Displays the approximate result and absolute error ($|v_{\text{expected}} - v_{\text{actual}}| \approx 10^{-8}$).

---

### Demo 2: Client–Server CKKS (Outsourced with Side-by-Side View)

Features an **Interactive Side-by-Side Execution View**:

```
+---------------------------------------------------------------------------------------------------+
|                            Interactive Side-by-Side Execution View                                |
|                                                                                                   |
|  [💻 Client Domain: Browser WASM]                    [☁️ Server Domain: Node.js Cloud Worker]     |
|  --------------------------------                    -----------------------------------------    |
|  • Secret Key: 🔒 RETAINED IN WASM (Never Leaves)    • Secret Key Access: 🚫 ZERO ACCESS (DENIED) |
|  • Plaintext: Known ONLY to Client                   • Plaintext Visibility: 100% BLINDED (0%)   |
|    Vector A: [1.5, 2.0, 3.5, 4.0]                    • Raw Ciphertext Received by Server:         |
|    Vector B: [2.0, 3.0, 1.0, 2.0]                      [XqEQBAEBAACcBwUAAAAAAHicTHdVVJ...]        |
|  • Outgoing Payload: 858.6 KB Base64                 • Server Execution Logs (direct from SEAL):  |
|  • Client Event Stream:                                • Received encrypted payload from client   |
|    › [1] Client keys generated                         • Deserialized ciphertexts into SEAL memory|
|    › [2] Vectors encrypted with Public Key             • Evaluated homomorphic operation          |
|    › [3] Ciphertexts serialized                        • Duration: 82.8 ms                        |
|    › [4] Transmitted via POST /api/compute           • Encrypted Output returned to client        |
|    › [7] Received encrypted result                                                                |
|    › [8] Decrypted with local Secret Key                                                          |
+---------------------------------------------------------------------------------------------------+
```

- **Step 1: Client Input**: User enters private vectors and selects operation.
- **Step 2: Key Generation**: Client generates Public Key, Secret Key, and RelinKeys. The **Secret Key strictly remains on the client** and is never transmitted.
- **Step 3: Encryption**: Client encodes and encrypts both vectors, serializing ciphertexts (and RelinKeys if multiplying) to zlib-compressed Base64.
- **Step 4: Network Transmission**: Client sends payload to `POST /api/compute`.
- **Step 5: Server Computation**: Server deserializes ciphertexts, initializes Evaluator, performs homomorphic evaluation **without possessing the Secret Key**, and returns the serialized encrypted result.
- **Step 6: Client Decryption**: Client receives encrypted result, decrypts it using its retained Secret Key, decodes the plaintext, and displays the result with a zero-knowledge privacy audit.

---

## 8. Security Best Practices

1. **Secret Key Isolation**: Secret keys are never serialized to local storage, cookies, or transmitted across the network.
2. **Zero-Knowledge Cloud Evaluation**: The server processes raw ciphertext polynomials without any knowledge of the underlying plaintexts.
3. **Reproducible Containerization**: All dependencies are locked and containerized with Docker for cross-platform Linux deployment.
