export type JsonObject = Record<string, unknown>;

export interface OctraWalletStatus {
  loaded: boolean;
  has_encrypted: boolean;
  has_legacy: boolean;
  needs_pin: boolean;
  needs_create: boolean;
}

export interface OctraWalletInfo {
  address: string;
  public_key: string;
  rpc_url: string;
  explorer_url: string;
}

export interface OctraWalletIdentity {
  address: string;
  public_key: string;
}

export interface OctraBalance {
  public_balance: string;
  encrypted_balance: string;
  nonce: number;
  staging: number;
}

export interface OctraFeeTier {
  minimum: string;
  recommended: string;
  fast?: string;
}

export type OctraFeeMap = Record<string, OctraFeeTier>;

export interface OctraTransaction {
  hash: string;
  from: string;
  to_: string;
  amount_raw: string;
  op_type: string;
  status: string;
  timestamp?: number;
  nonce?: number;
  ou?: string;
  message?: string;
  encrypted_data?: string;
  reject_reason?: string;
  reject_type?: string;
  signature?: string;
  public_key?: string;
  epoch?: number;
  block_height?: number;
}

export interface OctraHistory {
  transactions: OctraTransaction[];
}

export interface OctraStealthOutput {
  id: number | string;
  amount_raw: string;
  epoch: number;
  sender: string;
  tx_hash: string;
  claim_secret: string;
  blinding: string;
  claimed: boolean;
}

export interface OctraStealthScanResult {
  outputs: OctraStealthOutput[];
}

export interface OctraStealthClaimItem {
  id: string | number;
  ok: boolean;
  tx_hash?: string;
  error?: string;
}

export interface OctraStealthClaimResult {
  results: OctraStealthClaimItem[];
}

export interface OctraKeys {
  address: string;
  public_key: string;
  private_key: string;
  view_pubkey: string;
}

export interface OctraCompileResult {
  bytecode: string;
  size: number;
  instructions: number;
  version?: string;
  abi?: unknown;
}

export interface OctraContractAddressResult {
  address: string;
  deployer: string;
  nonce: number;
}

export interface OctraTxResult {
  tx_hash?: string;
  hash?: string;
  error?: string;
  contract_address?: string;
  steps?: string[];
  [key: string]: unknown;
}

export interface OctraTokensResult {
  count: number;
  wallet_address: string;
  tokens: OctraToken[];
}

export interface OctraToken {
  address: string;
  name: string;
  symbol: string;
  total_supply: string;
  balance: string;
  decimals: string;
  owner?: string;
}

export interface OctraSettingsResult {
  ok: boolean;
  rpc_url: string;
  explorer_url: string;
}

export interface OctraFheEncryptResult {
  ciphertext: string;
}

export interface OctraFheDecryptResult {
  value: number;
}

export interface OctraContractStorageResult {
  value: unknown;
}

export interface OctraApiErrorPayload {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export interface OctraRequestOptions {
  signal?: AbortSignal;
}

export interface WalletPinInput {
  pin: string;
}

export interface WalletImportInput extends WalletPinInput {
  priv: string;
}

export interface WalletChangePinInput {
  current_pin: string;
  new_pin: string;
}

export interface SendInput {
  to: string;
  amount: string;
  message?: string;
  ou?: string | number;
}

export interface AmountInput {
  amount: string;
  ou?: string | number;
}

export interface StealthSendInput {
  to: string;
  amount: string;
  ou?: string | number;
}

export interface StealthClaimInput {
  ids: Array<string | number>;
  ou?: string | number;
}

export interface ContractCompileInput {
  source: string;
}

export interface ContractAddressInput {
  bytecode: string;
}

export interface ContractDeployInput {
  bytecode: string;
  params?: string;
  source?: string;
  abi?: string;
  ou?: string | number;
}

export interface ContractVerifyInput {
  address: string;
  source: string;
}

export interface ContractCallInput {
  address: string;
  method: string;
  params?: unknown[];
  amount?: string;
  ou?: string | number;
}

export interface ContractViewInput {
  address: string;
  method: string;
  params?: unknown[];
}

export interface FheEncryptInput {
  value: number;
}

export interface FheDecryptInput {
  ciphertext: string;
}

export interface TokenTransferInput {
  token: string;
  to: string;
  amount: string;
  ou?: string | number;
}

export interface SettingsInput {
  rpc_url: string;
  explorer_url?: string;
}

export interface OctraClientConfig {
  baseUrl?: string;
  apiPathPrefix?: string;
  fetchFn?: typeof fetch;
}
