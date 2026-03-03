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

1. Start Octra `webcli` locally (default: `http://127.0.0.1:8420`).
2. Install dependencies:

```bash
npm install
```

3. Run the React demo:

```bash
npm run dev
```

Vite proxies `/api/*` to `http://127.0.0.1:8420` by default.

Optional env override:

```bash
VITE_OCTRA_API_URL=http://127.0.0.1:8420 npm run dev
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

## Attribution and licensing

- This project is licensed under **GPL-2.0-or-later** (see [LICENSE](./LICENSE)).
- API behavior and endpoint compatibility are based on Octra Wallet (`webcli`) by Octra Labs.
- Upstream copyright and notices are preserved in [NOTICE.md](./NOTICE.md).

Again, this repo is an **unofficial personal toolkit** and not an official Octra product.
