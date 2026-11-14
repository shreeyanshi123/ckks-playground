import React from 'react';
import ReactDOM from 'react-dom/client';
import SEAL from 'node-seal';

console.log('Testing SEAL import in client:', SEAL);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div>CKKS Demo</div>
  </React.StrictMode>
);

