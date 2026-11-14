import React from 'react';

export default function Home({ onSelectDemo }) {
  return (
    <div className="py-6 max-w-3xl mx-auto">
      {/* Title & Subtitle */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          CKKS Playground
        </h1>
        <p className="text-base text-gray-600">
          Explore Homomorphic Encryption
        </p>
      </div>

      {/* Exactly Two Prominent Demo Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demo 1: CKKS Basics */}
        <button
          type="button"
          onClick={() => onSelectDemo('demo1')}
          className="flex flex-col justify-between p-6 text-left bg-white border border-gray-200 rounded-xl hover:border-blue-600 hover:shadow-md transition-all group cursor-pointer"
        >
          <div>
            <div className="inline-block px-2.5 py-0.5 mb-3 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded">
              Demo 1
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              CKKS Basics
            </h2>
            <p className="text-xs font-medium text-gray-500 mb-3">
              Understand Homomorphic Encryption
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Demonstrate the complete CKKS cryptographic workflow locally inside the browser using WebAssembly.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-semibold text-blue-600">
            <span>Launch CKKS Basics</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>

        {/* Demo 2: Client–Server CKKS */}
        <button
          type="button"
          onClick={() => onSelectDemo('demo2')}
          className="flex flex-col justify-between p-6 text-left bg-white border border-gray-200 rounded-xl hover:border-blue-600 hover:shadow-md transition-all group cursor-pointer"
        >
          <div>
            <div className="inline-block px-2.5 py-0.5 mb-3 text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded">
              Demo 2
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              Client–Server CKKS
            </h2>
            <p className="text-xs font-medium text-gray-500 mb-3">
              Privacy-Preserving Computation
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Demonstrate how encrypted data can be sent to a server for computation without revealing the original data.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-semibold text-blue-600">
            <span>Launch Client–Server Demo</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </button>
      </div>

      {/* Minimal Technical Architecture Summary */}
      <div className="mt-12 p-4 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
        <div className="font-semibold text-gray-800 mb-1">Architecture Overview:</div>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <span className="font-medium text-gray-700">Demo 1 (Browser):</span> 100% Client WebAssembly (Microsoft SEAL WASM). No backend server involved.
          </div>
          <div>
            <span className="font-medium text-gray-700">Demo 2 (Outsourced):</span> React Client WASM + Node.js Server. Server performs evaluation without Secret Key.
          </div>
        </div>
      </div>
    </div>
  );
}
