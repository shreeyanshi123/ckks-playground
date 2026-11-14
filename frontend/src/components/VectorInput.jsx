import React from 'react';

export default function VectorInput({
  vectorAStr,
  setVectorAStr,
  vectorBStr,
  setVectorBStr,
  onApplyPreset,
  validationError
}) {
  return (
    <div className="space-y-4">
      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Presets:</span>
        <button
          type="button"
          onClick={() => onApplyPreset('1.5, 2.0, 3.5, 4.0', '2.0, 3.0, 1.0, 2.0')}
          className="px-2.5 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Default [1.5, 2.0, 3.5, 4.0]
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset('1, 2, 3, 4', '4, 3, 2, 1')}
          className="px-2.5 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Integers [1, 2, 3, 4]
        </button>
        <button
          type="button"
          onClick={() => onApplyPreset('0.5, 1.25, 2.75, 3.1', '2.0, 4.0, 0.5, 1.5')}
          className="px-2.5 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Fractions
        </button>
      </div>

      {/* Vector A */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-700">Vector A</label>
          <span className="text-xs text-gray-400">Comma-separated numerical values</span>
        </div>
        <input
          type="text"
          value={vectorAStr}
          onChange={(e) => setVectorAStr(e.target.value)}
          placeholder="e.g. 1.5, 2.0, 3.5, 4.0"
          className="w-full px-3 py-2 font-mono text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Vector B */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-gray-700">Vector B</label>
          <span className="text-xs text-gray-400">Must match Vector A length</span>
        </div>
        <input
          type="text"
          value={vectorBStr}
          onChange={(e) => setVectorBStr(e.target.value)}
          placeholder="e.g. 2.0, 3.0, 1.0, 2.0"
          className="w-full px-3 py-2 font-mono text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>

      {validationError && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md">
          {validationError}
        </div>
      )}
    </div>
  );
}
