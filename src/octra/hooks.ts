import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { OctraApiError } from './client';
import { useOctraClient } from './client-context';
import type {
  AmountInput,
  ContractAddressInput,
  ContractCallInput,
  ContractCompileInput,
  ContractDeployInput,
  ContractVerifyInput,
  ContractViewInput,
  FheDecryptInput,
  FheEncryptInput,
  JsonObject,
  OctraBalance,
  OctraCompileResult,
  OctraContractAddressResult,
  OctraContractStorageResult,
  OctraFeeMap,
  OctraFheDecryptResult,
  OctraFheEncryptResult,
  OctraHistory,
  OctraKeys,
  OctraSettingsResult,
  OctraStealthClaimResult,
  OctraStealthScanResult,
  OctraTokensResult,
  OctraTransaction,
  OctraTxResult,
  OctraWalletIdentity,
  OctraWalletInfo,
  OctraWalletStatus,
  SendInput,
  SettingsInput,
  StealthClaimInput,
  StealthSendInput,
  TokenTransferInput,
  WalletChangePinInput,
  WalletImportInput,
  WalletPinInput,
} from './types';

type OctraQueryOptions<TData> = Omit<UseQueryOptions<TData, OctraApiError, TData, QueryKey>, 'queryKey' | 'queryFn'>;

type OctraMutationOptions<TData, TVariables> = UseMutationOptions<TData, OctraApiError, TVariables>;

export const octraQueryKeys = {
  root: ['octra'] as const,
  wallet: ['octra', 'wallet'] as const,
  walletStatus: ['octra', 'wallet', 'status'] as const,
  walletInfo: ['octra', 'wallet', 'info'] as const,
  balance: ['octra', 'balance'] as const,
  fees: ['octra', 'fees'] as const,
  keys: ['octra', 'keys'] as const,
  historyRoot: ['octra', 'history'] as const,
  history: (limit: number, offset: number) => ['octra', 'history', limit, offset] as const,
  tx: (hash: string) => ['octra', 'tx', hash] as const,
  stealthScan: ['octra', 'stealth', 'scan'] as const,
  tokens: ['octra', 'tokens'] as const,
  contractStorage: (address: string, key: string) => ['octra', 'contract-storage', address, key] as const,
  contractView: (input: ContractViewInput) => ['octra', 'contract-view', input] as const,
  contractInfo: (address: string) => ['octra', 'contract-info', address] as const,
  contractReceipt: (hash: string) => ['octra', 'contract-receipt', hash] as const,
};

const useInvalidateCoreWalletQueries = () => {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: octraQueryKeys.wallet });
    void queryClient.invalidateQueries({ queryKey: octraQueryKeys.balance });
    void queryClient.invalidateQueries({ queryKey: octraQueryKeys.historyRoot });
    void queryClient.invalidateQueries({ queryKey: octraQueryKeys.tokens });
    void queryClient.invalidateQueries({ queryKey: octraQueryKeys.stealthScan });
  };
};

export const useWalletStatus = (options?: OctraQueryOptions<OctraWalletStatus>): UseQueryResult<OctraWalletStatus, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.walletStatus,
    queryFn: ({ signal }) => client.walletStatus({ signal }),
    refetchInterval: 5_000,
    ...options,
  });
};

export const useWallet = (options?: OctraQueryOptions<OctraWalletInfo>): UseQueryResult<OctraWalletInfo, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.walletInfo,
    queryFn: ({ signal }) => client.walletInfo({ signal }),
    ...options,
  });
};

export const useBalance = (options?: OctraQueryOptions<OctraBalance>): UseQueryResult<OctraBalance, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.balance,
    queryFn: ({ signal }) => client.balance({ signal }),
    ...options,
  });
};

export const useHistory = (
  limit = 20,
  offset = 0,
  options?: OctraQueryOptions<OctraHistory>,
): UseQueryResult<OctraHistory, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.history(limit, offset),
    queryFn: ({ signal }) => client.history(limit, offset, { signal }),
    ...options,
  });
};

export const useFees = (options?: OctraQueryOptions<OctraFeeMap>): UseQueryResult<OctraFeeMap, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.fees,
    queryFn: ({ signal }) => client.fees({ signal }),
    staleTime: 60_000,
    ...options,
  });
};

export const useTransaction = (
  hash: string | undefined,
  options?: OctraQueryOptions<OctraTransaction>,
): UseQueryResult<OctraTransaction, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.tx(hash ?? ''),
    queryFn: ({ signal }) => client.transaction(hash ?? '', { signal }),
    enabled: Boolean(hash) && (options?.enabled ?? true),
    ...options,
  });
};

export const useKeys = (options?: OctraQueryOptions<OctraKeys>): UseQueryResult<OctraKeys, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.keys,
    queryFn: ({ signal }) => client.keys({ signal }),
    ...options,
  });
};

export const useStealthScan = (
  options?: OctraQueryOptions<OctraStealthScanResult>,
): UseQueryResult<OctraStealthScanResult, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.stealthScan,
    queryFn: ({ signal }) => client.stealthScan({ signal }),
    ...options,
  });
};

export const useTokens = (options?: OctraQueryOptions<OctraTokensResult>): UseQueryResult<OctraTokensResult, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.tokens,
    queryFn: ({ signal }) => client.tokens({ signal }),
    ...options,
  });
};

export const useContractStorage = (
  address: string | undefined,
  key: string | undefined,
  options?: OctraQueryOptions<OctraContractStorageResult>,
): UseQueryResult<OctraContractStorageResult, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.contractStorage(address ?? '', key ?? ''),
    queryFn: ({ signal }) => client.contractStorage(address ?? '', key ?? '', { signal }),
    enabled: Boolean(address) && Boolean(key) && (options?.enabled ?? true),
    ...options,
  });
};

export const useContractView = (
  input: ContractViewInput | undefined,
  options?: OctraQueryOptions<JsonObject>,
): UseQueryResult<JsonObject, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.contractView(
      input ?? {
        address: '',
        method: '',
      },
    ),
    queryFn: ({ signal }) => client.contractView(input ?? { address: '', method: '' }, { signal }),
    enabled: Boolean(input?.address) && Boolean(input?.method) && (options?.enabled ?? true),
    ...options,
  });
};

export const useContractInfo = (
  address: string | undefined,
  options?: OctraQueryOptions<JsonObject>,
): UseQueryResult<JsonObject, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.contractInfo(address ?? ''),
    queryFn: ({ signal }) => client.contractInfo(address ?? '', { signal }),
    enabled: Boolean(address) && (options?.enabled ?? true),
    ...options,
  });
};

export const useContractReceipt = (
  hash: string | undefined,
  options?: OctraQueryOptions<JsonObject>,
): UseQueryResult<JsonObject, OctraApiError> => {
  const client = useOctraClient();
  return useQuery({
    queryKey: octraQueryKeys.contractReceipt(hash ?? ''),
    queryFn: ({ signal }) => client.contractReceipt(hash ?? '', { signal }),
    enabled: Boolean(hash) && (options?.enabled ?? true),
    ...options,
  });
};

export const useUnlockWallet = (
  options?: OctraMutationOptions<OctraWalletIdentity, WalletPinInput>,
): UseMutationResult<OctraWalletIdentity, OctraApiError, WalletPinInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.walletUnlock(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useLockWallet = (
  options?: OctraMutationOptions<{ ok: boolean }, void>,
): UseMutationResult<{ ok: boolean }, OctraApiError, void> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: () => client.walletLock(),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useCreateWallet = (
  options?: OctraMutationOptions<OctraWalletIdentity, WalletPinInput>,
): UseMutationResult<OctraWalletIdentity, OctraApiError, WalletPinInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.walletCreate(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useImportWallet = (
  options?: OctraMutationOptions<OctraWalletIdentity, WalletImportInput>,
): UseMutationResult<OctraWalletIdentity, OctraApiError, WalletImportInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.walletImport(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useChangePin = (
  options?: OctraMutationOptions<{ ok: boolean }, WalletChangePinInput>,
): UseMutationResult<{ ok: boolean }, OctraApiError, WalletChangePinInput> => {
  const client = useOctraClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.walletChangePin(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useSend = (
  options?: OctraMutationOptions<OctraTxResult, SendInput>,
): UseMutationResult<OctraTxResult, OctraApiError, SendInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.send(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useEncrypt = (
  options?: OctraMutationOptions<OctraTxResult, AmountInput>,
): UseMutationResult<OctraTxResult, OctraApiError, AmountInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.encrypt(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useDecrypt = (
  options?: OctraMutationOptions<OctraTxResult, AmountInput>,
): UseMutationResult<OctraTxResult, OctraApiError, AmountInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.decrypt(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useStealthSend = (
  options?: OctraMutationOptions<OctraTxResult, StealthSendInput>,
): UseMutationResult<OctraTxResult, OctraApiError, StealthSendInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.stealthSend(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useStealthClaim = (
  options?: OctraMutationOptions<OctraStealthClaimResult, StealthClaimInput>,
): UseMutationResult<OctraStealthClaimResult, OctraApiError, StealthClaimInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.stealthClaim(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useCompileContract = (
  options?: OctraMutationOptions<OctraCompileResult, ContractCompileInput>,
): UseMutationResult<OctraCompileResult, OctraApiError, ContractCompileInput> => {
  const client = useOctraClient();
  return useMutation({
    ...options,
    mutationFn: (input) => client.contractCompile(input),
  });
};

export const useCompileAml = (
  options?: OctraMutationOptions<OctraCompileResult, ContractCompileInput>,
): UseMutationResult<OctraCompileResult, OctraApiError, ContractCompileInput> => {
  const client = useOctraClient();
  return useMutation({
    ...options,
    mutationFn: (input) => client.contractCompileAml(input),
  });
};

export const useContractAddress = (
  options?: OctraMutationOptions<OctraContractAddressResult, ContractAddressInput>,
): UseMutationResult<OctraContractAddressResult, OctraApiError, ContractAddressInput> => {
  const client = useOctraClient();
  return useMutation({
    ...options,
    mutationFn: (input) => client.contractAddress(input),
  });
};

export const useDeployContract = (
  options?: OctraMutationOptions<OctraTxResult, ContractDeployInput>,
): UseMutationResult<OctraTxResult, OctraApiError, ContractDeployInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.contractDeploy(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useVerifyContract = (
  options?: OctraMutationOptions<JsonObject, ContractVerifyInput>,
): UseMutationResult<JsonObject, OctraApiError, ContractVerifyInput> => {
  const client = useOctraClient();
  return useMutation({
    ...options,
    mutationFn: (input) => client.contractVerify(input),
  });
};

export const useContractCall = (
  options?: OctraMutationOptions<OctraTxResult, ContractCallInput>,
): UseMutationResult<OctraTxResult, OctraApiError, ContractCallInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.contractCall(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useFheEncrypt = (
  options?: OctraMutationOptions<OctraFheEncryptResult, FheEncryptInput>,
): UseMutationResult<OctraFheEncryptResult, OctraApiError, FheEncryptInput> => {
  const client = useOctraClient();
  return useMutation({
    ...options,
    mutationFn: (input) => client.fheEncrypt(input),
  });
};

export const useFheDecrypt = (
  options?: OctraMutationOptions<OctraFheDecryptResult, FheDecryptInput>,
): UseMutationResult<OctraFheDecryptResult, OctraApiError, FheDecryptInput> => {
  const client = useOctraClient();
  return useMutation({
    ...options,
    mutationFn: (input) => client.fheDecrypt(input),
  });
};

export const useTokenTransfer = (
  options?: OctraMutationOptions<OctraTxResult, TokenTransferInput>,
): UseMutationResult<OctraTxResult, OctraApiError, TokenTransferInput> => {
  const client = useOctraClient();
  const invalidate = useInvalidateCoreWalletQueries();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.tokenTransfer(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      invalidate();
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useUpdateSettings = (
  options?: OctraMutationOptions<OctraSettingsResult, SettingsInput>,
): UseMutationResult<OctraSettingsResult, OctraApiError, SettingsInput> => {
  const client = useOctraClient();
  const queryClient = useQueryClient();
  const { onSuccess, ...rest } = options ?? {};

  return useMutation({
    ...rest,
    mutationFn: (input) => client.settings(input),
    onSuccess: (data, variables, onMutateResult, context) => {
      void queryClient.invalidateQueries({ queryKey: octraQueryKeys.walletInfo });
      onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
