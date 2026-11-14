import React from 'react';

export default function ExecutionLogs({ logs = [], title = 'Execution Logs' }) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <span className="text-xs font-semibold text-gray-700 tracking-wide">{title}</span>
        </div>
        <span className="text-[11px] font-mono text-gray-500">{logs.length} events logged</span>
      </div>
      <div className="p-3 bg-gray-50/50 font-mono text-xs space-y-1.5 max-h-56 overflow-y-auto">
        {logs.map((log, index) => (
          <div key={index} className="flex items-start text-gray-700 leading-relaxed">
            <span className="text-gray-400 select-none mr-2">›</span>
            <span>{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
