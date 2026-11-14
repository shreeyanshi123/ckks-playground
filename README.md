# CKKS Homomorphic Encryption Demo & Playground

An interactive, production-ready demonstration of **CKKS Homomorphic Encryption** powered by **Microsoft SEAL** (via WebAssembly and Node.js).

Designed with a minimal white user interface, featuring two independent demonstrations:
1. **Demo 1: CKKS Basics** — 100% in-browser homomorphic encryption using Microsoft SEAL compiled to WebAssembly.
2. **Demo 2: Client–Server CKKS** — Outsourced computation where a client encrypts private vectors, transmits ciphertexts to an untrusted cloud server, the server performs homomorphic computation without ever accessing the secret key, and returns the encrypted result for client-side decryption.

---

## Technical Architecture

| Component | Demo 1 (CKKS Basics) | Demo 2 (Client–Server) |
| :--- | :--- | :--- |
| **React UI** | Yes (Vite + React) | Yes (Vite + React) |
| **Client-Side WASM** | Yes (Microsoft SEAL WASM) | Yes (Microsoft SEAL WASM) |
| **Node.js Server** | No | Yes (Express + Microsoft SEAL WASM) |
| **Microsoft SEAL Engine** | In-Browser WebAssembly | Browser WASM + Node.js Linux Container |
| **Key Generation** | Local Browser | Local Client (Secret key never leaves browser) |
| **Encryption** | Browser | Client |
| **Homomorphic Computation** | Browser Evaluator | Remote Server (Zero Secret Key Access) |
| **Decryption** | Browser | Client |

### CKKS Cryptographic Parameters
Both demos share identical Microsoft SEAL CKKS configurations:
- **Scheme**: CKKS (Cheon-Kim-Kim-Song approximate arithmetic scheme)
- **Polynomial Modulus Degree ($N$)**: `8192` (provides `4096` complex SIMD slots)
- **Coefficient Modulus Chain**: `[60, 40, 40, 60]` bits
- **Scale Factor ($\Delta$)**: $2^{40}$ (providing $\approx 10^{-7}$ to $10^{-9}$ precision)
- **Security Level**: 128-bit classical security (`SecLevelType.tc128` per HomomorphicEncryption.org standard)
- **Ciphertext Serialization**: Zlib compressed Base64

---

## Running with Docker (Recommended for Linux)

This project is fully containerized using **Docker** and **Docker Compose**, making it straightforward to run on any Linux distribution (Ubuntu, Debian, Fedora, Arch, Alpine, etc.) as well as macOS and Windows.

### Prerequisites
- Docker Engine (v20+)
- Docker Compose (v2+)

### One-Command Launch
Clone or navigate to the repository and run:

```bash
docker compose up --build
```

Docker will:
1. Build the **Node.js server container** (`ckks-server`) running Microsoft SEAL on Linux on port `5001`.
2. Build the **React client container** (`ckks-client`) compiled to static assets and served via high-performance **Nginx** on port `3000`.
3. Configure the Nginx reverse proxy to forward `/api/*` requests to the server container.

### Accessing the Demos
- **Web UI**: Open [http://localhost:3000](http://localhost:3000)
- **Server Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

### Stopping Containers
```bash
docker compose down
```

---

## Running Locally Without Docker

If you prefer to run directly on your host machine:

### Prerequisites
- **Node.js** (v18, v20, or v22+)
- **npm** (v9+)

### Installation
From the root directory, install all dependencies for both client and server:

```bash
npm run install:all
```

### Running Both Client and Server
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
npm run server
```
*Listens on `http://localhost:5001`*

**Terminal 2 (Frontend Client):**
```bash
npm run client
```
*Vite dev server starts on `http://localhost:3000` (with automated `/api` proxy to `http://localhost:5001`)*

---

## Project Directory Structure

```text
Cryptography-Project/
├── docker-compose.yml           # Linux orchestration (client + server services)
├── package.json                 # Root script runner (dev, install:all, docker)
├── README.md                    # Project documentation
│
├── server/                      # Outsourced Homomorphic Evaluator Backend
│   ├── Dockerfile               # Debian-based Linux Node.js container
│   ├── package.json             # Express, cors, node-seal
│   └── src/
│       ├── server.js            # Express API (/api/health, /api/evaluate)
│       └── ckksEvaluator.js     # Server-side Microsoft SEAL homomorphic evaluator
│
└── client/                      # Interactive React + WASM Frontend
    ├── Dockerfile               # Multi-stage build + Nginx production server
    ├── nginx.conf               # WebAssembly MIME types & reverse proxy
    ├── vite.config.js           # Vite config with WASM support & proxy
    ├── package.json             # React 18, Vite, node-seal
    └── src/
        ├── index.css            # Minimal white UI styling
        ├── App.jsx              # Application router
        ├── seal/
        │   └── sealManager.js   # Client-side Microsoft SEAL WASM manager
        ├── components/
        │   ├── Header.jsx       # Minimalist navigation
        │   ├── Home.jsx         # Home page with two primary demo buttons
        │   ├── Demo1Basics.jsx  # Demo 1: In-browser CKKS Basics
        │   └── Demo2ClientServer.jsx # Demo 2: Client-Server Outsourced CKKS
        └── utils/
            └── vectorUtils.js   # Vector parser, formatters & error calculation
```

---

## Cryptographic Operations Explained

### Demo 1: CKKS Basics (In-Browser WASM)
1. **Key Generation**: Creates Secret Key ($sk$), Public Key ($pk$), and Relinearization Keys ($relinKeys$) inside the browser.
2. **Encoding**: Converts floating-point numbers into a plaintext polynomial using canonical embedding scaled by $\Delta = 2^{40}$.
3. **Encryption**: Multiplies plaintext by public key elements with discrete Gaussian error polynomials to produce ciphertext $c = (c_0, c_1)$.
4. **Homomorphic Evaluation**:
   - **Addition**: $c_{\text{add}} = (c_{0}^{(A)} + c_{0}^{(B)}, c_{1}^{(A)} + c_{1}^{(B)})$.
   - **Multiplication**: Tensor product produces a degree-2 ciphertext $(c_0, c_1, c_2)$. Relinearization uses public relinearization keys to reduce it back to $(c'_0, c'_1)$. Rescaling drops the lowest modulus prime and divides the scale by that prime, keeping noise and scale bounded.
5. **Decryption & Decoding**: Secret key evaluates the inner product, and inverse canonical embedding extracts the decrypted vector.
6. **Error Analysis**: Calculates absolute error $|v_{\text{plain}} - v_{\text{ckks}}| \approx 10^{-7}$, illustrating CKKS's approximate homomorphic nature.

### Demo 2: Client–Server CKKS (Outsourced Private Computation)
1. **Client**: Vector inputs are encoded and encrypted locally using the client's public key.
2. **Key Isolation**: The **Secret Key is retained strictly in the browser** and is never sent over the network.
3. **Network Transfer**: Ciphertexts (and relinearization keys if multiplying) are serialized to zlib-compressed base64 and sent via `POST /api/evaluate`.
4. **Untrusted Server**: The Node.js server evaluates the homomorphic operation using Microsoft SEAL without possessing the secret key. The server sees only pseudo-random polynomial coefficients.
5. **Encrypted Response**: The server sends back the encrypted result ciphertext.
6. **Client Decryption**: The client decrypts and decodes the result with its private secret key, revealing the computation without having disclosed any raw data to the server.

