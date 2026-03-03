import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useMemo, useState } from 'react';

import { createOctraWebCliClient, type OctraWebCliClient } from './client';
import { OctraClientContext } from './client-context';
import type { OctraClientConfig } from './types';

interface OctraKitProviderProps {
  children: ReactNode;
  client?: OctraWebCliClient;
  clientConfig?: OctraClientConfig;
  queryClient?: QueryClient;
}

const createDefaultQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
};

export const OctraKitProvider = ({
  children,
  client,
  clientConfig,
  queryClient,
}: OctraKitProviderProps)=> {
  const [internalQueryClient] = useState<QueryClient>(() => queryClient ?? createDefaultQueryClient());

  const contextClient = useMemo(() => {
    return client ?? createOctraWebCliClient(clientConfig);
  }, [client, clientConfig]);

  return (
    <QueryClientProvider client={internalQueryClient}>
      <OctraClientContext.Provider value={contextClient}>{children}</OctraClientContext.Provider>
    </QueryClientProvider>
  );
};
