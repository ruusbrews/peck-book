# PeckTag worker scan flow

This project is a mobile-first demo for a worker-facing scan flow on frozen chicken packaging in Qatar. It is intentionally separate from the existing admin/reasoning prototype in this repo: the worker app reads a barcode from a physical strip, confirms shipment details in a modal, and then shows a verdict and recommended action. The separate admin/BDI feature remains in place under `/admin` and is intentionally not connected to this worker flow for this pass. The app is designed for a hackathon demo and is deliberately scoped to a self-contained barcode-driven scenario lookup rather than a live backend or shared state with the reasoning agent.

Deployed demo: [https://peck-book.web.app/](https://peck-book.web.app/)

## Current worker-facing user flow

1. Open the app at the root route (`/`) or `/scan`.
2. The camera screen opens with a tall, bookmark-shaped viewfinder so the strip remains visible, plus a wide barcode guide at the bottom.
3. A worker scans the Code 128 barcode on the case.
4. If the barcode matches a known scenario, the app pauses scanning and opens a confirmation modal.
5. The worker edits or confirms the batch ID, location, and supply-chain stage, then taps `Confirm`.
6. A short success state appears and the app logs a stub submission object to `console.log`.
7. The verdict view appears with the ammonia result, freeze-thaw result, overall verdict badge, and recommended action.
8. The worker taps `Scan next shipment` to resume scanning. The camera screen also has a footer link to the separate admin agent demo at `/admin`.

This pass is intentionally a demo only: no Firebase write, no database, no shared state, and no import from `src/agent/*`.

## Tech stack and dependencies

- React 18
- Vite 8
- Vitest 4 for tests
- React Router DOM for route-based separation between the worker scan flow and the admin route
- Firebase SDK initialized in `src/firebase.js` for deployment setup
- `react-qr-barcode-scanner` for webcam barcode scanning using `react-webcam` and `@zxing/library`

### Dependency references and citations

- `react-qr-barcode-scanner`: https://www.npmjs.com/package/react-qr-barcode-scanner
- The package is built on `react-webcam` and `@zxing/library`, and it uses ZXing’s default supported format set for live scan decoding.
- GitHub project: https://github.com/jamenamcinteer/react-qr-barcode-scanner
- Original webcam barcode scanning concept: https://github.com/dashboardphilippines/react-webcam-barcode-scanner
- License: MIT (confirmed from the package metadata in `node_modules/react-qr-barcode-scanner/package.json`)

## Local run instructions

From the project root:

```bash
npm install
npm start
```

The app starts with the Vite script in `package.json`:

```json
"start": "cross-env BROWSER=none WDS_SOCKET_PORT=0 vite --host --port 3000"
```

The server binds to all network interfaces for Codespaces port forwarding and uses port 3000 by default. If that port is already occupied, Vite automatically tries the next available port.

Run the tests:

```bash
npm test -- --run
```

Production build:

```bash
npm run build
```

## Current scope and limitations

- Verdicts are hardcoded by barcode in `src/data/scenarios.js`.
- The worker flow uses a lookup table, not a real image-analysis engine.
- No real database or backend is connected yet; submission logging is a stub and writes to `console.log`.
- This scan flow is intentionally not connected to the existing agent feature under `src/agent/*`.
- The separate admin demo remains available at `/admin` and is not part of this worker flow.
- The barcode guide is a visual alignment aid; the scanner decodes from the camera feed rather than restricting decoding to only the guide rectangle.
- Camera scanning requires a secure context (`https` or `localhost`), which matches the Codespace setup.

## Demo barcode scenarios

The three demo barcodes are:

- `50503694` — `good` / `pass` / `continue`
- `60405891` — `moderate` / `caution` / `continue_inspect`
- `70309813` — `bad` / `fail` / `stop`

These are valid numeric strings that can be encoded as Code 128. They are defined in `src/data/scenarios.js` and are intended to be the authoritative local source for this pass.

## Architecture notes

- `src/App.jsx` routes the app: `/` and `/scan` render the worker-facing scan flow, while `/admin` renders the existing admin/decision-demo screen.
- `src/ScanFlow.jsx` handles the live camera scan and the confirmation modal.
- `src/ScanFlow.css` contains the mobile-first styling for the worker flow.
- `src/data/scenarios.js` is the single source of truth for the barcode-driven outcomes and is explicitly not tied to the agent code.
- `src/agent/*` remains untouched and separate by design.

## Separate admin feature note

A separate, already-built reasoning/admin demo exists in `src/AgentDemo.jsx` and the underlying logic under `src/agent/`. This pass intentionally does not connect it to the worker scan flow. If a future pass wants to integrate them, it should be a deliberate integration after both systems are independently stable.
