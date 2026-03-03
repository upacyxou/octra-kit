import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { OctraKitProvider } from './octra';

const octraApiBase = import.meta.env.VITE_OCTRA_API_URL ?? '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OctraKitProvider clientConfig={{ baseUrl: octraApiBase }}>
      <App />
    </OctraKitProvider>
  </StrictMode>,
);
