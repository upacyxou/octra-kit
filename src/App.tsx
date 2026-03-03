import { useEffect, useMemo, useState } from 'react';

import { JsonView } from './components/JsonView';
import { Section } from './components/Section';
import {
  isOctraApiError,
  formatOctRaw,
  shortHash,
  useBalance,
  useChangePin,
  useCompileAml,
  useCompileContract,
  useContractAddress,
  useContractCall,
  useContractInfo,
  useContractReceipt,
  useContractStorage,
  useContractView,
  useCreateWallet,
  useDecrypt,
  useDeployContract,
  useEncrypt,
  useFees,
  useFheDecrypt,
  useFheEncrypt,
  useHistory,
  useImportWallet,
  useKeys,
  useLockWallet,
  useSend,
  useStealthClaim,
  useStealthScan,
  useStealthSend,
  useTokens,
  useTransaction,
  useUnlockWallet,
  useUpdateSettings,
  useWallet,
  useWalletStatus,
  useTokenTransfer,
  type JsonObject,
} from './octra';
import './app.css';

const AML_SAMPLE = `contract Counter {
  storage count: u64 = 0;
}`;

const ASM_SAMPLE = `; constructor
CALLER r0
SSTORE "owner", r0
STOP`;

type CompileLanguage = 'auto' | 'aml' | 'asm';

const toErrorMessage = (error: unknown): string => {
  if (isOctraApiError(error)) {
    return `${error.status} ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
};

const parseJsonArray = (value: string): unknown[] => {
  if (!value.trim()) {
    return [];
  }

  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('Params must be a JSON array. Example: ["arg1", 2]');
  }
  return parsed;
};

const detectCompileTarget = (source: string): 'aml' | 'asm' => {
  const trimmed = source.trim();
  if (!trimmed) {
    return 'aml';
  }

  const amlPattern = /\b(contract|state|constructor|fn|storage|self|let|view)\b/;
  if (amlPattern.test(trimmed)) {
    return 'aml';
  }

  if (/[{}]/.test(trimmed)) {
    return 'aml';
  }

  return 'asm';
};

function App() {
  const walletStatus = useWalletStatus();
  const isWalletLoaded = walletStatus.data?.loaded ?? false;

  const wallet = useWallet({ enabled: isWalletLoaded });
  const balance = useBalance({ enabled: isWalletLoaded, refetchInterval: 10_000 });
  const fees = useFees({ enabled: isWalletLoaded });
  const history = useHistory(20, 0, { enabled: isWalletLoaded, refetchInterval: 15_000 });
  const stealthScan = useStealthScan({ enabled: isWalletLoaded, refetchInterval: 20_000 });
  const tokens = useTokens({ enabled: isWalletLoaded, refetchInterval: 20_000 });

  const [showKeys, setShowKeys] = useState(false);
  const keys = useKeys({ enabled: isWalletLoaded && showKeys });

  const [lookupTxHash, setLookupTxHash] = useState('');
  const transaction = useTransaction(lookupTxHash.trim() || undefined, {
    enabled: false,
  });

  const [unlockPin, setUnlockPin] = useState('');
  const [createPin, setCreatePin] = useState('');
  const [importPin, setImportPin] = useState('');
  const [importPriv, setImportPriv] = useState('');
  const [changePinCurrent, setChangePinCurrent] = useState('');
  const [changePinNext, setChangePinNext] = useState('');

  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('0.1');
  const [sendMessage, setSendMessage] = useState('');
  const [sendFee, setSendFee] = useState('');

  const [encryptAmount, setEncryptAmount] = useState('0.1');
  const [encryptFee, setEncryptFee] = useState('');
  const [decryptAmount, setDecryptAmount] = useState('0.1');
  const [decryptFee, setDecryptFee] = useState('');

  const [stealthTo, setStealthTo] = useState('');
  const [stealthAmount, setStealthAmount] = useState('0.1');
  const [stealthFee, setStealthFee] = useState('');
  const [claimIds, setClaimIds] = useState('');
  const [claimFee, setClaimFee] = useState('');

  const [selectedTokenAddress, setSelectedTokenAddress] = useState('');
  const [tokenTo, setTokenTo] = useState('');
  const [tokenAmountRaw, setTokenAmountRaw] = useState('1');
  const [tokenFee, setTokenFee] = useState('');

  const [compileLanguage, setCompileLanguage] = useState<CompileLanguage>('auto');
  const [compileSource, setCompileSource] = useState(AML_SAMPLE);
  const [bytecode, setBytecode] = useState('');
  const [deployParams, setDeployParams] = useState('');
  const [deployFee, setDeployFee] = useState('');

  const [contractAddress, setContractAddress] = useState('');
  const [contractMethod, setContractMethod] = useState('');
  const [contractParams, setContractParams] = useState('[]');
  const [contractCallAmount, setContractCallAmount] = useState('0');
  const [contractCallFee, setContractCallFee] = useState('');

  const [viewAddress, setViewAddress] = useState('');
  const [viewMethod, setViewMethod] = useState('');
  const [viewParams, setViewParams] = useState('[]');

  const [storageAddress, setStorageAddress] = useState('');
  const [storageKey, setStorageKey] = useState('symbol');

  const [infoAddress, setInfoAddress] = useState('');
  const [receiptHash, setReceiptHash] = useState('');

  const [fheValue, setFheValue] = useState('7');
  const [fheCiphertext, setFheCiphertext] = useState('');

  const [rpcUrl, setRpcUrl] = useState('');
  const [explorerUrl, setExplorerUrl] = useState('');

  const unlockWallet = useUnlockWallet();
  const lockWallet = useLockWallet();
  const createWallet = useCreateWallet();
  const importWallet = useImportWallet();
  const changePin = useChangePin();

  const send = useSend();
  const encrypt = useEncrypt();
  const decrypt = useDecrypt();
  const stealthSend = useStealthSend();
  const stealthClaim = useStealthClaim();
  const tokenTransfer = useTokenTransfer();

  const compileAsm = useCompileContract();
  const compileAml = useCompileAml();
  const buildContractAddress = useContractAddress();
  const deployContract = useDeployContract();
  const callContract = useContractCall();
  const updateSettings = useUpdateSettings();
  const fheEncrypt = useFheEncrypt();
  const fheDecrypt = useFheDecrypt();

  const contractView = useContractView(
    viewAddress.trim() && viewMethod.trim()
      ? {
          address: viewAddress.trim(),
          method: viewMethod.trim(),
          params: (() => {
            try {
              return parseJsonArray(viewParams);
            } catch {
              return [];
            }
          })(),
        }
      : undefined,
    { enabled: false },
  );

  const contractStorage = useContractStorage(storageAddress.trim() || undefined, storageKey.trim() || undefined, {
    enabled: false,
  });

  const contractInfo = useContractInfo(infoAddress.trim() || undefined, {
    enabled: false,
  });

  const contractReceipt = useContractReceipt(receiptHash.trim() || undefined, {
    enabled: false,
  });

  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<unknown>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const runAction = async <T,>(label: string, action: () => Promise<T>): Promise<T | undefined> => {
    setActiveAction(label);
    setLastError(null);

    try {
      const result = await action();
      setLastResult({ action: label, result, at: new Date().toISOString() });
      return result;
    } catch (error) {
      setLastError(`${label}: ${toErrorMessage(error)}`);
      return undefined;
    } finally {
      setActiveAction(null);
    }
  };

  useEffect(() => {
    if (wallet.data?.rpc_url) {
      setRpcUrl(wallet.data.rpc_url);
    }
    if (wallet.data?.explorer_url) {
      setExplorerUrl(wallet.data.explorer_url);
    }
  }, [wallet.data?.rpc_url, wallet.data?.explorer_url]);

  useEffect(() => {
    if (!fees.data) {
      return;
    }

    setSendFee((prev) => prev || fees.data.standard?.recommended || '');
    setEncryptFee((prev) => prev || fees.data.encrypt?.recommended || '');
    setDecryptFee((prev) => prev || fees.data.decrypt?.recommended || '');
    setStealthFee((prev) => prev || fees.data.stealth?.recommended || '');
    setClaimFee((prev) => prev || fees.data.claim?.recommended || '');
    setTokenFee((prev) => prev || fees.data.call?.recommended || '');
    setDeployFee((prev) => prev || fees.data.deploy?.recommended || '');
    setContractCallFee((prev) => prev || fees.data.call?.recommended || '');
  }, [fees.data]);

  useEffect(() => {
    if (!tokens.data?.tokens?.length) {
      return;
    }

    if (!selectedTokenAddress) {
      setSelectedTokenAddress(tokens.data.tokens[0].address);
    }
  }, [selectedTokenAddress, tokens.data?.tokens]);

  const selectedToken = useMemo(() => {
    return tokens.data?.tokens.find((token) => token.address === selectedTokenAddress);
  }, [selectedTokenAddress, tokens.data?.tokens]);

  const unclaimedStealthOutputs = useMemo(() => {
    return (stealthScan.data?.outputs ?? []).filter((output) => !output.claimed);
  }, [stealthScan.data?.outputs]);

  const appBusy = Boolean(activeAction);

  const queryError =
    walletStatus.error ?? wallet.error ?? balance.error ?? history.error ?? fees.error ?? stealthScan.error ?? tokens.error;

  const topError = lastError ?? (queryError ? toErrorMessage(queryError) : null);

  return (
    <div className="app">
      <header className="hero">
        <h1>Octra React Kit</h1>
        <p>
          Unofficial React hooks wrapper for Octra <code>webcli</code>.
        </p>
        <p className="disclaimer">
          This project is independent and not affiliated with, endorsed by, or officially connected to Octra Labs or the Octra
          team.
        </p>
        <div className="status-grid">
          <div>
            <span className="label">Wallet Loaded</span>
            <span className={isWalletLoaded ? 'ok' : 'muted'}>{isWalletLoaded ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="label">Needs PIN</span>
            <span>{walletStatus.data?.needs_pin ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="label">Needs Create</span>
            <span>{walletStatus.data?.needs_create ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="label">RPC</span>
            <span>{wallet.data?.rpc_url ?? 'n/a'}</span>
          </div>
        </div>
      </header>

      {topError ? <div className="error-banner">{topError}</div> : null}

      <Section title="Wallet Controls" subtitle="Create/import/unlock/lock and PIN management">
        <div className="grid two">
          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction('wallet.unlock', () => unlockWallet.mutateAsync({ pin: unlockPin.trim() }));
            }}
          >
            <h3>Unlock</h3>
            <input value={unlockPin} onChange={(event) => setUnlockPin(event.target.value)} placeholder="6-digit pin" />
            <button disabled={appBusy}>Unlock Wallet</button>
          </form>

          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction('wallet.create', () => createWallet.mutateAsync({ pin: createPin.trim() }));
            }}
          >
            <h3>Create</h3>
            <input value={createPin} onChange={(event) => setCreatePin(event.target.value)} placeholder="6-digit pin" />
            <button disabled={appBusy}>Create Wallet</button>
          </form>

          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction('wallet.import', () =>
                importWallet.mutateAsync({
                  pin: importPin.trim(),
                  priv: importPriv.trim(),
                }),
              );
            }}
          >
            <h3>Import</h3>
            <textarea
              value={importPriv}
              onChange={(event) => setImportPriv(event.target.value)}
              placeholder="Base64 private key"
              rows={3}
            />
            <input value={importPin} onChange={(event) => setImportPin(event.target.value)} placeholder="6-digit pin" />
            <button disabled={appBusy}>Import Wallet</button>
          </form>

          <div className="form-block">
            <h3>Lock + Change PIN</h3>
            <button
              disabled={appBusy || !isWalletLoaded}
              onClick={() => {
                void runAction('wallet.lock', () => lockWallet.mutateAsync());
              }}
            >
              Lock Wallet
            </button>
            <input
              value={changePinCurrent}
              onChange={(event) => setChangePinCurrent(event.target.value)}
              placeholder="current pin"
            />
            <input value={changePinNext} onChange={(event) => setChangePinNext(event.target.value)} placeholder="new pin" />
            <button
              disabled={appBusy || !isWalletLoaded}
              onClick={() => {
                void runAction('wallet.change-pin', () =>
                  changePin.mutateAsync({
                    current_pin: changePinCurrent.trim(),
                    new_pin: changePinNext.trim(),
                  }),
                );
              }}
            >
              Change PIN
            </button>
          </div>
        </div>
      </Section>

      <Section title="Balances + History" subtitle="Public/encrypted balance, nonce, and recent transactions">
        <div className="stats-row">
          <div className="stat">
            <span className="label">Address</span>
            <span>{wallet.data?.address ? shortHash(wallet.data.address, 12, 10) : 'n/a'}</span>
          </div>
          <div className="stat">
            <span className="label">Public Balance</span>
            <span>{formatOctRaw(balance.data?.public_balance ?? 0)}</span>
          </div>
          <div className="stat">
            <span className="label">Encrypted Balance</span>
            <span>{formatOctRaw(balance.data?.encrypted_balance ?? 0)}</span>
          </div>
          <div className="stat">
            <span className="label">Nonce</span>
            <span>{balance.data?.nonce ?? '-'}</span>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Hash</th>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>To</th>
              </tr>
            </thead>
            <tbody>
              {(history.data?.transactions ?? []).slice(0, 12).map((tx) => (
                <tr key={tx.hash}>
                  <td>{shortHash(tx.hash)}</td>
                  <td>{tx.op_type}</td>
                  <td>{tx.status}</td>
                  <td>{formatOctRaw(tx.amount_raw)}</td>
                  <td>{shortHash(tx.to_ ?? '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="inline-controls">
          <input
            value={lookupTxHash}
            onChange={(event) => setLookupTxHash(event.target.value)}
            placeholder="Lookup tx hash"
          />
          <button
            disabled={!lookupTxHash.trim()}
            onClick={() => {
              void runAction('tx.lookup', async () => {
                const result = await transaction.refetch();
                if (result.error) {
                  throw result.error;
                }
                return result.data as unknown;
              });
            }}
          >
            Fetch Tx
          </button>
        </div>
      </Section>

      <Section title="Send + Encrypt" subtitle="Standard send plus encrypt/decrypt operations">
        <div className="grid three">
          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction('tx.send', () =>
                send.mutateAsync({
                  to: sendTo.trim(),
                  amount: sendAmount.trim(),
                  message: sendMessage.trim() || undefined,
                  ou: sendFee.trim() || undefined,
                }),
              );
            }}
          >
            <h3>Send OCT</h3>
            <input value={sendTo} onChange={(event) => setSendTo(event.target.value)} placeholder="recipient oct..." />
            <input value={sendAmount} onChange={(event) => setSendAmount(event.target.value)} placeholder="0.100000" />
            <input value={sendMessage} onChange={(event) => setSendMessage(event.target.value)} placeholder="message (optional)" />
            <input value={sendFee} onChange={(event) => setSendFee(event.target.value)} placeholder="fee ou" />
            <button disabled={appBusy || !isWalletLoaded}>Send</button>
          </form>

          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction('tx.encrypt', () =>
                encrypt.mutateAsync({
                  amount: encryptAmount.trim(),
                  ou: encryptFee.trim() || undefined,
                }),
              );
            }}
          >
            <h3>Encrypt</h3>
            <input
              value={encryptAmount}
              onChange={(event) => setEncryptAmount(event.target.value)}
              placeholder="0.100000"
            />
            <input value={encryptFee} onChange={(event) => setEncryptFee(event.target.value)} placeholder="fee ou" />
            <button disabled={appBusy || !isWalletLoaded}>Encrypt Amount</button>
          </form>

          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction('tx.decrypt', () =>
                decrypt.mutateAsync({
                  amount: decryptAmount.trim(),
                  ou: decryptFee.trim() || undefined,
                }),
              );
            }}
          >
            <h3>Decrypt</h3>
            <input
              value={decryptAmount}
              onChange={(event) => setDecryptAmount(event.target.value)}
              placeholder="0.100000"
            />
            <input value={decryptFee} onChange={(event) => setDecryptFee(event.target.value)} placeholder="fee ou" />
            <button disabled={appBusy || !isWalletLoaded}>Decrypt Amount</button>
          </form>
        </div>
      </Section>

      <Section title="Stealth" subtitle="Stealth send, scan outputs, and claim by output id">
        <div className="grid two">
          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction('stealth.send', () =>
                stealthSend.mutateAsync({
                  to: stealthTo.trim(),
                  amount: stealthAmount.trim(),
                  ou: stealthFee.trim() || undefined,
                }),
              );
            }}
          >
            <h3>Stealth Send</h3>
            <input value={stealthTo} onChange={(event) => setStealthTo(event.target.value)} placeholder="recipient oct..." />
            <input
              value={stealthAmount}
              onChange={(event) => setStealthAmount(event.target.value)}
              placeholder="0.100000"
            />
            <input value={stealthFee} onChange={(event) => setStealthFee(event.target.value)} placeholder="fee ou" />
            <button disabled={appBusy || !isWalletLoaded}>Stealth Send</button>
          </form>

          <div className="form-block">
            <h3>Stealth Scan + Claim</h3>
            <p>Unclaimed outputs: {unclaimedStealthOutputs.length}</p>
            <button
              disabled={appBusy || !isWalletLoaded}
              onClick={() => {
                void runAction('stealth.scan', async () => {
                  const result = await stealthScan.refetch();
                  if (result.error) {
                    throw result.error;
                  }
                  return result.data as unknown;
                });
              }}
            >
              Scan Outputs
            </button>
            <input
              value={claimIds}
              onChange={(event) => setClaimIds(event.target.value)}
              placeholder="ids comma-separated (e.g. 1,2,3)"
            />
            <input value={claimFee} onChange={(event) => setClaimFee(event.target.value)} placeholder="fee ou" />
            <button
              disabled={appBusy || !isWalletLoaded}
              onClick={() => {
                const ids = claimIds
                  .split(',')
                  .map((value) => value.trim())
                  .filter(Boolean);
                void runAction('stealth.claim', () => stealthClaim.mutateAsync({ ids, ou: claimFee.trim() || undefined }));
              }}
            >
              Claim IDs
            </button>
          </div>
        </div>
      </Section>

      <Section title="Tokens" subtitle="Fetch wallet token balances and submit transfer calls">
        <div className="grid two">
          <div className="form-block">
            <h3>Token Balances</h3>
            <button
              disabled={appBusy || !isWalletLoaded}
              onClick={() => {
                void runAction('tokens.refresh', async () => {
                  const result = await tokens.refetch();
                  if (result.error) {
                    throw result.error;
                  }
                  return result.data as unknown;
                });
              }}
            >
              Refresh Tokens
            </button>
            <ul className="token-list">
              {(tokens.data?.tokens ?? []).map((token) => (
                <li key={token.address}>
                  <strong>{token.symbol}</strong> {token.balance} raw
                </li>
              ))}
            </ul>
          </div>

          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              if (!selectedTokenAddress) {
                setLastError('token.transfer: select a token');
                return;
              }

              void runAction('token.transfer', () =>
                tokenTransfer.mutateAsync({
                  token: selectedTokenAddress,
                  to: tokenTo.trim(),
                  amount: tokenAmountRaw.trim(),
                  ou: tokenFee.trim() || undefined,
                }),
              );
            }}
          >
            <h3>Transfer Token</h3>
            <select value={selectedTokenAddress} onChange={(event) => setSelectedTokenAddress(event.target.value)}>
              {(tokens.data?.tokens ?? []).map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} ({shortHash(token.address)})
                </option>
              ))}
            </select>
            <input value={tokenTo} onChange={(event) => setTokenTo(event.target.value)} placeholder="recipient oct..." />
            <input
              value={tokenAmountRaw}
              onChange={(event) => setTokenAmountRaw(event.target.value)}
              placeholder="raw amount"
            />
            <input value={tokenFee} onChange={(event) => setTokenFee(event.target.value)} placeholder="fee ou" />
            <button disabled={appBusy || !isWalletLoaded || !selectedTokenAddress}>Transfer Token</button>
            {selectedToken ? <small>Selected: {selectedToken.name}</small> : null}
          </form>
        </div>
      </Section>

      <Section title="Contracts + FHE" subtitle="Compile/deploy/call/view plus contract storage, info and receipt lookups">
        <div className="grid two">
          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              const source = compileSource.trim();
              if (!source) {
                setLastError('contract.compile: source required');
                return;
              }

              const detectedTarget = detectCompileTarget(source);
              const target = compileLanguage === 'auto' ? detectedTarget : compileLanguage;

              if (compileLanguage === 'asm' && detectedTarget === 'aml') {
                setLastError(
                  'contract.compile.asm: source looks like AML. Switch compiler to AML or Auto.',
                );
                return;
              }

              void runAction(`contract.compile.${target}`, async () => {
                const response =
                  target === 'aml'
                    ? await compileAml.mutateAsync({ source })
                    : await compileAsm.mutateAsync({ source });

                if (response.bytecode) {
                  setBytecode(response.bytecode);
                }
                return response;
              });
            }}
          >
            <h3>Compile</h3>
            <select
              value={compileLanguage}
              onChange={(event) => {
                const nextLanguage = event.target.value as CompileLanguage;
                setCompileLanguage(nextLanguage);
                setCompileSource((prev) => {
                  if (!prev.trim() || prev === AML_SAMPLE || prev === ASM_SAMPLE) {
                    return nextLanguage === 'asm' ? ASM_SAMPLE : AML_SAMPLE;
                  }
                  return prev;
                });
              }}
            >
              <option value="auto">Auto (recommended)</option>
              <option value="aml">AML</option>
              <option value="asm">Assembly</option>
            </select>
            <textarea
              value={compileSource}
              onChange={(event) => setCompileSource(event.target.value)}
              rows={6}
              placeholder={compileLanguage === 'asm' ? ASM_SAMPLE : AML_SAMPLE}
            />
            <button disabled={appBusy || !isWalletLoaded}>Compile Source</button>
          </form>

          <div className="form-block">
            <h3>Deploy + Address</h3>
            <textarea value={bytecode} onChange={(event) => setBytecode(event.target.value)} rows={5} placeholder="bytecode" />
            <input value={deployParams} onChange={(event) => setDeployParams(event.target.value)} placeholder="params string" />
            <input value={deployFee} onChange={(event) => setDeployFee(event.target.value)} placeholder="fee ou" />
            <button
              disabled={appBusy || !isWalletLoaded || !bytecode.trim()}
              onClick={() => {
                void runAction('contract.address', () => buildContractAddress.mutateAsync({ bytecode: bytecode.trim() }));
              }}
            >
              Compute Address
            </button>
            <button
              disabled={appBusy || !isWalletLoaded || !bytecode.trim()}
              onClick={() => {
                void runAction('contract.deploy', () =>
                  deployContract.mutateAsync({
                    bytecode: bytecode.trim(),
                    params: deployParams.trim() || undefined,
                    ou: deployFee.trim() || undefined,
                    source: compileSource,
                  }),
                );
              }}
            >
              Deploy Contract
            </button>
          </div>

          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              let parsedParams: unknown[];
              try {
                parsedParams = parseJsonArray(contractParams);
              } catch (error) {
                setLastError(`contract.call: ${toErrorMessage(error)}`);
                return;
              }

              void runAction('contract.call', () =>
                callContract.mutateAsync({
                  address: contractAddress.trim(),
                  method: contractMethod.trim(),
                  params: parsedParams,
                  amount: contractCallAmount.trim() || '0',
                  ou: contractCallFee.trim() || undefined,
                }),
              );
            }}
          >
            <h3>Call Contract</h3>
            <input
              value={contractAddress}
              onChange={(event) => setContractAddress(event.target.value)}
              placeholder="contract address"
            />
            <input
              value={contractMethod}
              onChange={(event) => setContractMethod(event.target.value)}
              placeholder="method"
            />
            <input
              value={contractCallAmount}
              onChange={(event) => setContractCallAmount(event.target.value)}
              placeholder="amount raw"
            />
            <input
              value={contractCallFee}
              onChange={(event) => setContractCallFee(event.target.value)}
              placeholder="fee ou"
            />
            <textarea
              value={contractParams}
              onChange={(event) => setContractParams(event.target.value)}
              rows={3}
              placeholder='["arg1", 2]'
            />
            <button disabled={appBusy || !isWalletLoaded}>Send Contract Call Tx</button>
          </form>

          <div className="form-block">
            <h3>View / Storage / Info / Receipt</h3>
            <input value={viewAddress} onChange={(event) => setViewAddress(event.target.value)} placeholder="view address" />
            <input value={viewMethod} onChange={(event) => setViewMethod(event.target.value)} placeholder="view method" />
            <textarea value={viewParams} onChange={(event) => setViewParams(event.target.value)} rows={2} placeholder='[]' />
            <button
              disabled={appBusy || !isWalletLoaded || !viewAddress || !viewMethod}
              onClick={() => {
                void runAction('contract.view', async () => {
                  const result = await contractView.refetch();
                  if (result.error) {
                    throw result.error;
                  }
                  return result.data as unknown;
                });
              }}
            >
              Query View
            </button>

            <input
              value={storageAddress}
              onChange={(event) => setStorageAddress(event.target.value)}
              placeholder="storage address"
            />
            <input value={storageKey} onChange={(event) => setStorageKey(event.target.value)} placeholder="storage key" />
            <button
              disabled={appBusy || !isWalletLoaded || !storageAddress || !storageKey}
              onClick={() => {
                void runAction('contract.storage', async () => {
                  const result = await contractStorage.refetch();
                  if (result.error) {
                    throw result.error;
                  }
                  return result.data as unknown;
                });
              }}
            >
              Read Storage
            </button>

            <input value={infoAddress} onChange={(event) => setInfoAddress(event.target.value)} placeholder="info address" />
            <button
              disabled={appBusy || !isWalletLoaded || !infoAddress}
              onClick={() => {
                void runAction('contract.info', async () => {
                  const result = await contractInfo.refetch();
                  if (result.error) {
                    throw result.error;
                  }
                  return result.data as unknown;
                });
              }}
            >
              Contract Info
            </button>

            <input value={receiptHash} onChange={(event) => setReceiptHash(event.target.value)} placeholder="receipt tx hash" />
            <button
              disabled={appBusy || !isWalletLoaded || !receiptHash}
              onClick={() => {
                void runAction('contract.receipt', async () => {
                  const result = await contractReceipt.refetch();
                  if (result.error) {
                    throw result.error;
                  }
                  return result.data as unknown;
                });
              }}
            >
              Contract Receipt
            </button>
          </div>

          <div className="form-block">
            <h3>FHE Helpers</h3>
            <input value={fheValue} onChange={(event) => setFheValue(event.target.value)} placeholder="numeric value" />
            <button
              disabled={appBusy || !isWalletLoaded}
              onClick={() => {
                const numeric = Number(fheValue);
                if (!Number.isInteger(numeric)) {
                  setLastError('fhe.encrypt: value must be an integer');
                  return;
                }
                void runAction('fhe.encrypt', async () => {
                  const result = await fheEncrypt.mutateAsync({ value: numeric });
                  setFheCiphertext(result.ciphertext);
                  return result;
                });
              }}
            >
              FHE Encrypt
            </button>
            <textarea
              value={fheCiphertext}
              onChange={(event) => setFheCiphertext(event.target.value)}
              rows={3}
              placeholder="ciphertext"
            />
            <button
              disabled={appBusy || !isWalletLoaded || !fheCiphertext.trim()}
              onClick={() => {
                void runAction('fhe.decrypt', () => fheDecrypt.mutateAsync({ ciphertext: fheCiphertext.trim() }));
              }}
            >
              FHE Decrypt
            </button>
          </div>
        </div>
      </Section>

      <Section title="Settings + Keys" subtitle="Update RPC/explorer endpoint and inspect key material when needed">
        <div className="grid two">
          <form
            className="form-block"
            onSubmit={(event) => {
              event.preventDefault();
              void runAction('settings.update', () =>
                updateSettings.mutateAsync({
                  rpc_url: rpcUrl.trim(),
                  explorer_url: explorerUrl.trim() || undefined,
                }),
              );
            }}
          >
            <h3>Node Settings</h3>
            <input value={rpcUrl} onChange={(event) => setRpcUrl(event.target.value)} placeholder="rpc url" />
            <input
              value={explorerUrl}
              onChange={(event) => setExplorerUrl(event.target.value)}
              placeholder="explorer url"
            />
            <button disabled={appBusy || !isWalletLoaded}>Save Settings</button>
          </form>

          <div className="form-block">
            <h3>Wallet Keys</h3>
            <button
              disabled={appBusy || !isWalletLoaded}
              onClick={() => {
                if (!showKeys) {
                  setShowKeys(true);
                  return;
                }

                void runAction('wallet.keys', async () => {
                  const result = await keys.refetch();
                  if (result.error) {
                    throw result.error;
                  }
                  return result.data as unknown;
                });
              }}
            >
              {showKeys ? 'Refresh Keys' : 'Load Keys'}
            </button>
            {showKeys && keys.data ? <JsonView data={keys.data} /> : null}
          </div>
        </div>
      </Section>

      <Section title="Latest API Output" subtitle="Last successful action payload for quick debugging">
        {activeAction ? <div className="loading">Running: {activeAction}...</div> : null}
        {lastResult ? <JsonView data={lastResult as JsonObject} /> : <div className="muted">No action yet.</div>}
      </Section>
    </div>
  );
}

export default App;
