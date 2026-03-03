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
  OctraApiErrorPayload,
  OctraBalance,
  OctraClientConfig,
  OctraCompileResult,
  OctraContractAddressResult,
  OctraContractStorageResult,
  OctraFeeMap,
  OctraFheDecryptResult,
  OctraFheEncryptResult,
  OctraHistory,
  OctraKeys,
  OctraRequestOptions,
  OctraSettingsResult,
  OctraStealthClaimResult,
  OctraStealthScanResult,
  OctraToken,
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

interface RequestInput {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export class OctraApiError extends Error {
  public readonly status: number;
  public readonly data: OctraApiErrorPayload;

  public constructor(status: number, data: OctraApiErrorPayload) {
    super(data.error ?? data.message ?? `Octra API request failed with status ${status}`);
    this.name = 'OctraApiError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_PREFIX = '/api';

export class OctraWebCliClient {
  private readonly baseUrl: string;
  private readonly apiPrefix: string;
  private readonly fetchFn: typeof fetch;

  public constructor(config: OctraClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? '';
    this.apiPrefix = config.apiPathPrefix ?? DEFAULT_PREFIX;
    const nativeFetch = config.fetchFn ?? fetch;
    // Keep fetch context-safe in browsers where `window.fetch` requires Window as `this`.
    this.fetchFn = (input, init) => nativeFetch(input, init);
  }

  public walletStatus(options?: OctraRequestOptions): Promise<OctraWalletStatus> {
    return this.request('GET', '/wallet/status', options);
  }

  public walletInfo(options?: OctraRequestOptions): Promise<OctraWalletInfo> {
    return this.request('GET', '/wallet', options);
  }

  public walletUnlock(input: WalletPinInput, options?: OctraRequestOptions): Promise<OctraWalletIdentity> {
    return this.request('POST', '/wallet/unlock', { ...options, body: input });
  }

  public walletLock(options?: OctraRequestOptions): Promise<{ ok: boolean }> {
    return this.request('POST', '/wallet/lock', options);
  }

  public walletCreate(input: WalletPinInput, options?: OctraRequestOptions): Promise<OctraWalletIdentity> {
    return this.request('POST', '/wallet/create', { ...options, body: input });
  }

  public walletImport(input: WalletImportInput, options?: OctraRequestOptions): Promise<OctraWalletIdentity> {
    return this.request('POST', '/wallet/import', { ...options, body: input });
  }

  public walletChangePin(input: WalletChangePinInput, options?: OctraRequestOptions): Promise<{ ok: boolean }> {
    return this.request('POST', '/wallet/change-pin', { ...options, body: input });
  }

  public balance(options?: OctraRequestOptions): Promise<OctraBalance> {
    return this.request('GET', '/balance', options);
  }

  public history(limit = 20, offset = 0, options?: OctraRequestOptions): Promise<OctraHistory> {
    return this.request('GET', '/history', {
      ...options,
      query: { limit, offset },
    });
  }

  public transaction(hash: string, options?: OctraRequestOptions): Promise<OctraTransaction> {
    return this.request('GET', '/tx', {
      ...options,
      query: { hash },
    });
  }

  public fees(options?: OctraRequestOptions): Promise<OctraFeeMap> {
    return this.request('GET', '/fee', options);
  }

  public keys(options?: OctraRequestOptions): Promise<OctraKeys> {
    return this.request('GET', '/keys', options);
  }

  public send(input: SendInput, options?: OctraRequestOptions): Promise<OctraTxResult> {
    return this.request('POST', '/send', { ...options, body: input });
  }

  public encrypt(input: AmountInput, options?: OctraRequestOptions): Promise<OctraTxResult> {
    return this.request('POST', '/encrypt', { ...options, body: input });
  }

  public decrypt(input: AmountInput, options?: OctraRequestOptions): Promise<OctraTxResult> {
    return this.request('POST', '/decrypt', { ...options, body: input });
  }

  public stealthSend(input: StealthSendInput, options?: OctraRequestOptions): Promise<OctraTxResult> {
    return this.request('POST', '/stealth/send', { ...options, body: input });
  }

  public stealthScan(options?: OctraRequestOptions): Promise<OctraStealthScanResult> {
    return this.request('GET', '/stealth/scan', options);
  }

  public stealthClaim(input: StealthClaimInput, options?: OctraRequestOptions): Promise<OctraStealthClaimResult> {
    return this.request('POST', '/stealth/claim', { ...options, body: input });
  }

  public contractStorage(
    address: string,
    key: string,
    options?: OctraRequestOptions,
  ): Promise<OctraContractStorageResult> {
    return this.request('GET', '/contract-storage', {
      ...options,
      query: { address, key },
    });
  }

  public contractCompile(input: ContractCompileInput, options?: OctraRequestOptions): Promise<OctraCompileResult> {
    return this.request('POST', '/contract/compile', { ...options, body: input });
  }

  public contractCompileAml(input: ContractCompileInput, options?: OctraRequestOptions): Promise<OctraCompileResult> {
    return this.request('POST', '/contract/compile-aml', { ...options, body: input });
  }

  public contractAddress(
    input: ContractAddressInput,
    options?: OctraRequestOptions,
  ): Promise<OctraContractAddressResult> {
    return this.request('POST', '/contract/address', { ...options, body: input });
  }

  public contractDeploy(input: ContractDeployInput, options?: OctraRequestOptions): Promise<OctraTxResult> {
    return this.request('POST', '/contract/deploy', { ...options, body: input });
  }

  public contractVerify(input: ContractVerifyInput, options?: OctraRequestOptions): Promise<JsonObject> {
    return this.request('POST', '/contract/verify', { ...options, body: input });
  }

  public contractCall(input: ContractCallInput, options?: OctraRequestOptions): Promise<OctraTxResult> {
    return this.request('POST', '/contract/call', { ...options, body: input });
  }

  public contractView(input: ContractViewInput, options?: OctraRequestOptions): Promise<JsonObject> {
    return this.request('GET', '/contract/view', {
      ...options,
      query: {
        address: input.address,
        method: input.method,
        params: input.params ? JSON.stringify(input.params) : undefined,
      },
    });
  }

  public contractInfo(address: string, options?: OctraRequestOptions): Promise<JsonObject> {
    return this.request('GET', '/contract/info', {
      ...options,
      query: { address },
    });
  }

  public contractReceipt(hash: string, options?: OctraRequestOptions): Promise<JsonObject> {
    return this.request('GET', '/contract/receipt', {
      ...options,
      query: { hash },
    });
  }

  public fheEncrypt(input: FheEncryptInput, options?: OctraRequestOptions): Promise<OctraFheEncryptResult> {
    return this.request('POST', '/fhe/encrypt', { ...options, body: input });
  }

  public fheDecrypt(input: FheDecryptInput, options?: OctraRequestOptions): Promise<OctraFheDecryptResult> {
    return this.request('POST', '/fhe/decrypt', { ...options, body: input });
  }

  public tokens(options?: OctraRequestOptions): Promise<OctraTokensResult> {
    return this.request('GET', '/tokens', options);
  }

  public tokenTransfer(input: TokenTransferInput, options?: OctraRequestOptions): Promise<OctraTxResult> {
    return this.request('POST', '/token/transfer', { ...options, body: input });
  }

  public settings(input: SettingsInput, options?: OctraRequestOptions): Promise<OctraSettingsResult> {
    return this.request('POST', '/settings', { ...options, body: input });
  }

  private async request<TResponse>(
    method: 'GET' | 'POST',
    path: string,
    input: RequestInput = {},
  ): Promise<TResponse> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    const requestPath = `${this.apiPrefix}${path}`;
    const url = this.buildUrl(requestPath, input.query);

    const response = await this.fetchFn(url, {
      method,
      headers: input.body ? { ...headers, 'Content-Type': 'application/json' } : headers,
      body: input.body ? JSON.stringify(input.body) : undefined,
      signal: input.signal,
    });

    const text = await response.text();
    const data = text ? this.tryParseJson(text) : {};

    if (!response.ok) {
      const fallbackMessage = this.buildFallbackErrorMessage(method, requestPath, response.status, response.statusText, text);
      const payload = typeof data === 'object' && data ? (data as OctraApiErrorPayload) : {};
      if (!payload.error && !payload.message) {
        payload.message = fallbackMessage;
      }
      throw new OctraApiError(response.status, payload);
    }

    return data as TResponse;
  }

  private buildUrl(path: string, query?: Record<string, string | number | undefined>): string {
    const cleanedBase = this.baseUrl.trim();

    if (!cleanedBase) {
      if (!query) {
        return path;
      }

      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) {
          continue;
        }
        params.set(key, String(value));
      }
      const queryString = params.toString();
      return queryString ? `${path}?${queryString}` : path;
    }

    const url = new URL(path, cleanedBase.endsWith('/') ? cleanedBase : `${cleanedBase}/`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private tryParseJson(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { message: text };
    }
  }

  private buildFallbackErrorMessage(
    method: 'GET' | 'POST',
    requestPath: string,
    status: number,
    statusText: string,
    responseText: string,
  ): string {
    const statusLabel = statusText ? ` ${statusText}` : '';
    const trimmed = responseText.trim();
    if (trimmed.length > 0) {
      const preview = trimmed.length > 300 ? `${trimmed.slice(0, 300)}...` : trimmed;
      return `${method} ${requestPath} failed with ${status}${statusLabel}: ${preview}`;
    }
    return `${method} ${requestPath} failed with ${status}${statusLabel} (empty response body)`;
  }
}

export const createOctraWebCliClient = (config?: OctraClientConfig): OctraWebCliClient => {
  return new OctraWebCliClient(config);
};

export const isOctraApiError = (error: unknown): error is OctraApiError => {
  return error instanceof OctraApiError;
};

export const getTokenByAddress = (tokens: OctraToken[], address: string): OctraToken | undefined => {
  return tokens.find((token) => token.address === address);
};
