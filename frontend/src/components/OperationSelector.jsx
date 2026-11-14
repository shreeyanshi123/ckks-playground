import React from 'react';

export default function OperationSelector({ operation, setOperation, disabled }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
        Homomorphic Operation
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOperation('add')}
          className={`flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md border transition-all ${
            operation === 'add'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="mr-1.5 font-bold text-base">+</span> Addition
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setOperation('multiply')}
          className={`flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md border transition-all ${
            operation === 'multiply'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="mr-1.5 font-bold text-base">×</span> Element-wise Multiplication
        </button>
      </div>
    </div>
  );
}

