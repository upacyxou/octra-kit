import { createContext, useContext } from 'react';

import type { OctraWebCliClient } from './client';

export const OctraClientContext = createContext<OctraWebCliClient | null>(null);

export const useOctraClient = (): OctraWebCliClient => {
  const client = useContext(OctraClientContext);
  if (!client) {
    throw new Error('useOctraClient must be used inside OctraKitProvider.');
  }
  return client;
};
