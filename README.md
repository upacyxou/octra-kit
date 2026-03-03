# octra-react-kit

Unofficial React hooks kit for the [Octra webcli](https://github.com/octra-labs/webcli) HTTP API.

This repository is independent and **not affiliated with, endorsed by, or officially connected to Octra Labs or the Octra team**.
It exists to make local web testing of Octra `webcli` simpler.

## What you get

- React + TypeScript + Vite scaffold
- TanStack Query powered data layer
- `viem`-style hooks for the full `webcli` endpoint surface:
  - wallet lifecycle
  - balance/history/fees
  - send/encrypt/decrypt
  - stealth send/scan/claim
  - token transfer
  - contract compile/deploy/call/view/info/receipt/storage
  - FHE helper endpoints
  - settings update
- Ready-to-run demo web page wrapping those hooks

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Run everything (submodule init + `webcli` + React app) with one command:

```bash
npm run local
```

This command:

- initializes `vendor/webcli` submodule
- runs upstream `vendor/webcli/setup.sh` (or `setup.bat` on Windows) to install deps and build, if binary is missing
- starts `webcli` on `http://127.0.0.1:8420`
- starts Vite app on `http://127.0.0.1:5173`

3. Or run only the React demo (if `webcli` is already running):

```bash
npm run dev
```

Vite proxies `/api/*` to `http://127.0.0.1:8420` by default.

## Local requirements for one-command mode

- C++17 compiler
- OpenSSL 3.x headers/libs
- LevelDB headers/libs
- `make`

On macOS:

```bash
brew install openssl@3 leveldb
```

Optional env override:

```bash
VITE_OCTRA_API_URL=http://127.0.0.1:8420 npm run dev
```

For one-command mode, you can override ports:

```bash
OCTRA_WEBCLI_PORT=9000 VITE_PORT=5174 npm run local
```

If you want to skip dependency auto-install and call `make` directly:

```bash
OCTRA_WEBCLI_USE_SETUP=0 npm run local
```

## Hook usage

```tsx
import { OctraKitProvider, useWalletStatus, useBalance, useSend } from './src/octra';

function Example() {
  const status = useWalletStatus();
  const balance = useBalance({ enabled: status.data?.loaded });
  const send = useSend();

  return (
    <button
      onClick={() => send.mutate({ to: 'oct...', amount: '0.1' })}
      disabled={!status.data?.loaded}
    >
      Send
    </button>
  );
}

function App() {
  return (
    <OctraKitProvider clientConfig={{ baseUrl: 'http://127.0.0.1:8420' }}>
      <Example />
    </OctraKitProvider>
  );
}
```

## Arbitrary contracts: deploy, read, write

```tsx
import {
  useCompileAml,
  useContractAddress,
  useDeployContract,
  useContractCall,
  useContractView,
} from './src/octra';

function ArbitraryContractExample() {
  const compileAml = useCompileAml();
  const contractAddress = useContractAddress();
  const deploy = useDeployContract();
  const writeTx = useContractCall();
  const readView = useContractView(
    { address: 'oct_contract_address_here', method: 'get_count', params: [] },
    { enabled: false },
  );

  const deployCounter = async () => {
    const source = `contract Counter { storage count: u64 = 0; }`;
    const compiled = await compileAml.mutateAsync({ source });
    const predicted = await contractAddress.mutateAsync({ bytecode: compiled.bytecode });
    const deployed = await deploy.mutateAsync({ bytecode: compiled.bytecode, source });
    return { predicted: predicted.address, deployed: deployed.contract_address };
  };

  const writeAnyContract = async () => {
    await writeTx.mutateAsync({
      address: 'oct_contract_address_here',
      method: 'increment',
      params: [],
      amount: '0',
    });
  };

  const readAnyContract = async () => {
    const result = await readView.refetch();
    return result.data;
  };

  return null;
}
```

Notes:

- `useDeployContract` deploys your compiled bytecode.
- `useContractCall` writes to any deployed contract address (state-changing tx).
- `useContractView` reads any deployed contract address (read-only query).
- `useContractStorage` (also available) reads raw storage keys for any contract address.

## Attribution and licensing

- This project is licensed under **GPL-2.0-or-later** (see [LICENSE](./LICENSE)).
- API behavior and endpoint compatibility are based on Octra Wallet (`webcli`) by Octra Labs.
- Upstream copyright and notices are preserved in [NOTICE.md](./NOTICE.md).

Again, this repo is an **unofficial personal toolkit** and not an official Octra product.
