import React from 'react';

export default function Home({ onSelectDemo }) {
  return (
    <div className="home-wrapper">
      <div className="home-header">
        <h1>CKKS Playground</h1>
        <p>Explore homomorphic encryption through two interactive demonstrations.</p>
      </div>

      {/* Only two demo-selection buttons on the home page */}
      <div className="demos-grid">
        <button
          className="demo-card-button"
          onClick={() => onSelectDemo('demo1')}
          type="button"
        >
          <div>
            <span className="demo-tag">Demo 1</span>
            <div className="demo-title">CKKS Basics</div>
            <div className="demo-desc">
              Demonstrate the fundamental CKKS operations entirely in the browser using WASM.
            </div>
            <div className="demo-specs">
              <div className="demo-spec-item">
                <span className="demo-spec-label">Environment</span>
                <span className="demo-spec-val">100% In-Browser</span>
              </div>
              <div className="demo-spec-item">
                <span className="demo-spec-label">Architecture</span>
                <span className="demo-spec-val">React + SEAL WASM</span>
              </div>
              <div className="demo-spec-item">
                <span className="demo-spec-label">Operations</span>
                <span className="demo-spec-val">Encode, Encrypt, Eval, Decrypt</span>
              </div>
            </div>
          </div>
          <div className="demo-card-action">
            Open CKKS Basics →
          </div>
        </button>

        <button
          className="demo-card-button"
          onClick={() => onSelectDemo('demo2')}
          type="button"
        >
          <div>
            <span className="demo-tag">Demo 2</span>
            <div className="demo-title">Client–Server CKKS</div>
            <div className="demo-desc">
              Demonstrate how a client can outsource computation to a server without revealing its private data.
            </div>
            <div className="demo-specs">
              <div className="demo-spec-item">
                <span className="demo-spec-label">Environment</span>
                <span className="demo-spec-val">Client WASM + Node.js</span>
              </div>
              <div className="demo-spec-item">
                <span className="demo-spec-label">Architecture</span>
                <span className="demo-spec-val">React + Node Server + SEAL</span>
              </div>
              <div className="demo-spec-item">
                <span className="demo-spec-label">Outsourcing</span>
                <span className="demo-spec-val">Zero-Knowledge Cloud Eval</span>
              </div>
            </div>
          </div>
          <div className="demo-card-action">
            Open Client–Server Demo →
          </div>
        </button>
      </div>

      {/* Technical Architecture Comparison Table */}
      <div className="arch-card">
        <h3>Technical Architecture Comparison</h3>
        <table className="arch-table">
          <thead>
            <tr>
              <th>Component</th>
              <th>Demo 1 (Basics)</th>
              <th>Demo 2 (Client–Server)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>React UI</td>
              <td>Yes</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Client-side WASM</td>
              <td>Yes</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Node.js Server</td>
              <td>No</td>
              <td>Yes</td>
            </tr>
            <tr>
              <td>Microsoft SEAL</td>
              <td>Yes (WASM)</td>
              <td>Yes (WASM + Node)</td>
            </tr>
            <tr>
              <td>Encryption</td>
              <td>Browser</td>
              <td>Client</td>
            </tr>
            <tr>
              <td>Computation</td>
              <td>Browser</td>
              <td>Server (No Secret Key)</td>
            </tr>
            <tr>
              <td>Decryption</td>
              <td>Browser</td>
              <td>Client</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

