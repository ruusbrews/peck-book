import { useMemo, useRef, useState } from 'react';
import BarcodeScanner from 'react-qr-barcode-scanner';
import { SCENARIOS, STAGES } from './data/scenarios.js';
import './ScanFlow.css';

const EMPTY_FORM = {
  barcode: '',
  batchId: '',
  location: 'Doha, Qatar',
  stage: '',
};

// Worker-facing single-package scan flow for the demo. This screen is intentionally self-contained
// and does not import anything from src/agent/ so it can be demoed independently from the admin
// reasoning view that lives elsewhere in the app.
function ScanFlow() {
  const [showModal, setShowModal] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [scanError, setScanError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const scannerLocked = useRef(false);

  const matchedScenario = useMemo(
    () => (form.barcode ? SCENARIOS[form.barcode] : null),
    [form.barcode],
  );

  const resetToCamera = () => {
    scannerLocked.current = false;
    setShowModal(false);
    setIsLogging(false);
    setResultData(null);
    setScanError('');
    setForm(EMPTY_FORM);
  };

  const handleBarcodeUpdate = (error, result) => {
    if (error || !result || scannerLocked.current) return;

    const barcode = String(result.getText()).trim();
    if (!barcode) return;

    const scenario = SCENARIOS[barcode];
    if (!scenario) {
      setScanError('Barcode not recognized');
      return;
    }

    scannerLocked.current = true;
    setScanError('');
    setForm({
      barcode,
      batchId: scenario.batchId,
      location: 'Doha, Qatar',
      stage: '',
    });
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!matchedScenario || !form.stage) return;

    const logEntry = {
      barcode: form.barcode,
      batchId: form.batchId,
      location: form.location,
      stage: form.stage,
      timestamp: new Date().toISOString(),
    };

    // Temporary stub for a future Firestore write. This is intentionally console-only for now.
    console.log('Worker scan submission logged (stub):', logEntry);

    setShowModal(false);
    setIsLogging(true);

    window.setTimeout(() => {
      setResultData({
        ...matchedScenario,
        ...logEntry,
      });
      setIsLogging(false);
    }, 1200);
  };

  const verdictTone = {
    pass: 'good',
    caution: 'warn',
    fail: 'bad',
  }[matchedScenario?.verdict ?? resultData?.verdict ?? 'pass'];

  return (
    <main className="scanflow-app">
      <div className="scanflow-shell">
        {!resultData && (
          <>
            <header className="scanflow-header">
              <div>
                <p className="eyebrow">Worker scan flow</p>
                <h1>Scan a shipment barcode</h1>
              </div>
            </header>

            <section className="scanner-card">
              <div className="scanner-stage">
                <BarcodeScanner
                  width="100%"
                  height="100%"
                  delay={250}
                  stopStream={showModal || isLogging}
                  facingMode="environment"
                  onUpdate={handleBarcodeUpdate}
                />
                <div className="scan-overlay">
                  <div className="scan-frame" aria-hidden="true" />
                </div>
              </div>

              <div className="scan-hint">
                <strong>Place the strip inside the frame</strong>
                <span>Scan the Code 128 barcode for the case you are logging.</span>
              </div>

              {scanError && <p className="inline-error">{scanError}</p>}
            </section>
          </>
        )}

        {showModal && (
          <div className="modal-backdrop" onClick={(event) => event.stopPropagation()}>
            <div className="modal-card" role="dialog" aria-modal="true">
              <div className="modal-header">
                <h2>Confirm shipment details</h2>
                <button type="button" className="ghost-button" onClick={resetToCamera}>
                  Cancel
                </button>
              </div>

              <div className="field-grid">
                <label className="field">
                  <span>Barcode</span>
                  <input value={form.barcode} readOnly />
                </label>

                <label className="field">
                  <span>Batch ID</span>
                  <input
                    value={form.batchId}
                    onChange={(event) => setForm((current) => ({ ...current, batchId: event.target.value }))}
                  />
                </label>

                <label className="field">
                  <span>Location</span>
                  <input
                    value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                  />
                </label>

                <label className="field">
                  <span>Supply-chain stage</span>
                  <select
                    value={form.stage}
                    onChange={(event) => setForm((current) => ({ ...current, stage: event.target.value }))}
                  >
                    <option value="">Select a stage</option>
                    {STAGES.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="button"
                className="primary-button"
                disabled={!form.stage}
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        )}

        {isLogging && (
          <div className="success-overlay" aria-live="polite">
            <div className="success-badge">✓</div>
            <p>Logged successfully</p>
          </div>
        )}

        {resultData && (
          <section className="verdict-card">
            <div className="result-header">
              <div>
                <p className="eyebrow">Shipment result</p>
                <h2>{resultData.batchId}</h2>
              </div>
              <span className={`verdict-badge ${verdictTone}`}>
                {resultData.verdict.toUpperCase()}
              </span>
            </div>

            <div className="result-grid">
              <div className="metric">
                <span className="metric-label">Ammonia / spoilage</span>
                <strong>{resultData.ammoniaResult === 'pass' ? 'Rot indicator: healthy' : 'Rot indicator: spoilage detected'}</strong>
              </div>

              <div className="metric">
                <span className="metric-label">Freeze-thaw</span>
                <strong>
                  {resultData.freezeThawResult === 'pass'
                    ? 'Freeze-thaw indicator: no evidence of thawing'
                    : 'Freeze-thaw indicator: thawing detected'}
                </strong>
              </div>
            </div>

            <div className={`action-banner ${resultData.action}`}>
              {resultData.actionLabel}
            </div>

            <p className="verdict-copy">{resultData.verdictLabel}</p>

            <button type="button" className="primary-button" onClick={resetToCamera}>
              Scan next shipment
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

export default ScanFlow;
