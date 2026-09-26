import { useCallback, useEffect, useMemo, useState } from 'react';
import { PeckAgent } from './agent/agent.js';
import { ACTIONS, KNOWLEDGE, STAGES } from './agent/knowledge.js';
import { SOURCE_TEXT } from './agent/sourceText.js';
import { LOCATIONS, demoEvents } from './agent/simulator.js';
import './AgentDemo.css';

const STAGE_TITLES = { port: 'Hamad Port', wholesale: 'Wholesale', retail: 'Shops' };

const ACTION_TONE = {
  [ACTIONS.CONTINUE]: 'good',
  [ACTIONS.RELEASE]: 'good',
  [ACTIONS.PRIORITIZE_SALE]: 'good',
  [ACTIONS.INSPECT]: 'warn',
  [ACTIONS.HOLD_FOR_INSPECTION]: 'warn',
  [ACTIONS.RESCAN]: 'muted',
  [ACTIONS.WITHDRAW]: 'bad',
  [ACTIONS.ESCALATE]: 'bad',
};

const stamp = (time) => new Date(time).toUTCString().slice(5, 22);
const nameOf = (id) => LOCATIONS.find((l) => l.id === id)?.name ?? id;

// Each labelled event starts a presentation step; unlabelled events ride along with it.
function buildSteps(events) {
  const steps = [];
  for (const event of events) {
    if (event.label || !steps.length) steps.push({ label: event.label, time: event.time, events: [] });
    steps.at(-1).events.push(event);
  }
  return steps;
}

// Replays the scenario from the start so stepping back is exact. Manual inspections are
// replayed right after the step they were recorded on.
function replay(steps, upto, manual) {
  const agent = new PeckAgent(LOCATIONS);
  let current = { trace: [], decisions: [] };
  const run = (events) => {
    const start = agent.trace.length;
    const decisions = events.flatMap((e) => agent.handle(e));
    current = { trace: agent.trace.slice(start), decisions };
  };
  for (let i = 0; i <= upto; i++) {
    run(steps[i].events);
    for (const m of manual.filter((m) => m.afterStep === i)) run([m.event]);
  }
  return { state: agent.getState(), current };
}

// Identical decisions (e.g. six packages all CONTINUE) are shown as one card.
function groupDecisions(decisions) {
  const groups = new Map();
  for (const d of decisions) {
    const key = `${d.action}|${d.reasons.join('|')}`;
    if (!groups.has(key)) groups.set(key, { ...d, targets: [] });
    groups.get(key).targets.push(d.target);
  }
  return [...groups.values()];
}

export default function AgentDemo() {
  const [step, setStep] = useState(-1);
  const [manual, setManual] = useState([]);

  const steps = useMemo(() => buildSteps(demoEvents()), []);
  const { state, current } = useMemo(() => replay(steps, step, manual), [steps, step, manual]);
  const manualHere = manual.filter((m) => m.afterStep === step);
  const lastManual = manualHere.at(-1);

  const reset = () => {
    setStep(-1);
    setManual([]);
  };

  // Place the inspection a few minutes after the current step so event times stay in order.
  const recordInspection = (fields) => {
    const base = Math.max(...steps[step].events.map((e) => Date.parse(e.time)));
    const time = new Date(base + (manualHere.length + 1) * 5 * 60 * 1000).toISOString();
    setManual((m) => [...m, { afterStep: step, event: { type: 'inspection', time, ...fields } }]);
  };

  const next = useCallback(() => setStep((s) => Math.min(s + 1, steps.length - 1)), [steps.length]);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, -1)), []);

  useEffect(() => {
    const onKey = (e) => {
      // Leave keys alone while typing in the inspector form or using a dropdown/button.
      if (e.target.closest?.('input, textarea, select, button, [contenteditable="true"]')) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        next();
      }
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, back]);

  const quiet = step >= 0 && steps[step].events.every((e) => e.quiet);
  const touched = new Set(current.decisions.map((d) => d.target));
  const trace = quiet ? current.trace.filter((t) => t.kind === 'intention' || t.kind === 'constraint') : current.trace;

  return (
    <div className="demo">
      <header className="demo-header">
        <div>
          <h1>PeckTag Agent</h1>
          <p className="subtitle">Cold-chain custody decisions for frozen chicken in Qatar</p>
        </div>
        <div className="controls">
          <button onClick={reset}>Reset</button>
          <button onClick={back} disabled={step < 0}>
            ◀ Back
          </button>
          <button className="primary" onClick={next} disabled={step === steps.length - 1}>
            Next ▶
          </button>
        </div>
      </header>

      <section className="narration">
        <span className="progress">
          Step {step + 1} / {steps.length}
        </span>
        {step < 0 ? (
          <span>Press Next (or →) to start the shipment.</span>
        ) : lastManual ? (
          <span>
            <strong>{stamp(lastManual.event.time)}</strong> · Manual inspection of{' '}
            {nameOf(lastManual.event.location ?? lastManual.event.packageId)}: {lastManual.event.result}
          </span>
        ) : (
          <span>
            <strong>{stamp(steps[step].time)}</strong> · {steps[step].label}
          </span>
        )}
      </section>

      <main className="grid">
        <section className="panel chain">
          <h2>Supply chain</h2>
          <div className="stages">
            {Object.keys(STAGES).map((stage) => (
              <div key={stage} className="stage">
                <h3>{STAGE_TITLES[stage]}</h3>
                {state.locations
                  .filter((l) => l.stage === stage)
                  .map((loc) => (
                    <LocationCard key={loc.id} loc={loc} packages={state.packages} touched={touched} />
                  ))}
              </div>
            ))}
          </div>
          <Legend />
        </section>

        <section className="panel mind">
          <h2>Agent</h2>
          <h3>Desires</h3>
          <ol className="desires">
            {state.desires.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ol>
          <h3>Intentions</h3>
          {state.intentions.length ? (
            state.intentions.map((i) => (
              <div key={i.key} className="intention">
                🔍 Investigate <strong>{nameOf(i.location)}</strong>
                <span className="since">since {stamp(i.since)}</span>
              </div>
            ))
          ) : (
            <p className="empty">No open commitments</p>
          )}
          <h3>Reasoning this step</h3>
          {quiet && <p className="empty">Routine scans: beliefs updated, nothing unusual.</p>}
          <ul className="trace">
            {trace.map((t, i) => (
              <li key={i}>
                <span className={`kind kind-${t.kind}`}>{t.kind}</span>
                {t.text}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel decisions">
          <h2>Decisions</h2>
          {!current.decisions.length && <p className="empty">No decisions yet.</p>}
          {groupDecisions(current.decisions).map((d, i) => (
            <DecisionCard key={i} decision={d} />
          ))}
          <InspectorPanel
            disabled={step < 0}
            locations={state.locations}
            packages={state.packages}
            onSubmit={recordInspection}
          />
        </section>
      </main>
    </div>
  );
}

function LocationCard({ loc, packages, touched }) {
  const here = packages.filter((p) => p.scans.at(-1)?.location === loc.id);
  return (
    <div className={`location status-${loc.status} ${touched.has(loc.id) ? 'touched' : ''}`}>
      <div className="location-head">
        <span>{loc.name}</span>
        {loc.status !== 'trusted' && <span className="badge">{loc.status}</span>}
      </div>
      {loc.incidents.length > 0 && <div className="incidents">{loc.incidents.length} thaw incident(s)</div>}
      <div className="chips">
        {here.map((p) => (
          <span
            key={p.id}
            className={`chip pkg-${p.status} ${touched.has(p.id) ? 'touched' : ''}`}
            title={p.holds.length ? `Holds: ${p.holds.join(', ')}` : 'No holds'}
          >
            {p.id}
            {p.breach && ' ❄️'}
          </span>
        ))}
      </div>
    </div>
  );
}

function DecisionCard({ decision }) {
  const { action, targets, reasons, basis, evidence } = decision;
  return (
    <article className={`decision tone-${ACTION_TONE[action]}`}>
      <div className="decision-head">
        <span className="action">{action.replaceAll('_', ' ')}</span>
        <span className="targets">{targets.map(nameOf).join(', ')}</span>
      </div>
      <ul>
        {reasons.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      {evidence && (
        <div className="evidence">
          Evidence:{' '}
          {evidence.map((e) => `${e.packageId} (after ${nameOf(e.after)}, before ${nameOf(e.before)})`).join('; ')}
        </div>
      )}
      {basis.length > 0 && <BasisList keys={[...new Set(basis.map((b) => b.key))]} />}
    </article>
  );
}

// Lets a presenter or judge record an inspection result live.
function InspectorPanel({ disabled, locations, packages, onSubmit }) {
  const [target, setTarget] = useState('');
  const [result, setResult] = useState('');
  const [inspector, setInspector] = useState('');
  const [temp, setTemp] = useState('');
  const [note, setNote] = useState('');

  const [kind, id] = target.split(':');
  const results = kind === 'location' ? ['clear', 'confirmed'] : ['pass', 'fail'];
  const labels = { clear: 'Cleared', confirmed: 'Violation confirmed', pass: 'Pass', fail: 'Fail' };

  const submit = (e) => {
    e.preventDefault();
    const tempC = Number.parseFloat(temp);
    onSubmit({
      ...(kind === 'location' ? { location: id } : { packageId: id }),
      result,
      ...(inspector.trim() && { inspector: inspector.trim() }),
      ...(note.trim() && { note: note.trim() }),
      ...(kind === 'package' && Number.isFinite(tempC) && { measuredTempC: tempC }),
    });
    setResult('');
    setTemp('');
    setNote('');
  };

  return (
    <form className="inspector" onSubmit={submit}>
      <h3>Record an inspection</h3>
      <p className="inspector-hint">Held stock stays held until an inspection is recorded here.</p>
      <label>
        Inspect
        <select
          value={target}
          disabled={disabled}
          onChange={(e) => {
            setTarget(e.target.value);
            setResult('');
          }}
        >
          <option value="">Choose...</option>
          <optgroup label="Locations">
            {locations.map((l) => (
              <option key={l.id} value={`location:${l.id}`}>
                {l.name}
                {l.status !== 'trusted' ? ` (${l.status})` : ''}
              </option>
            ))}
          </optgroup>
          <optgroup label="Packages">
            {packages.map((p) => (
              <option key={p.id} value={`package:${p.id}`}>
                {p.id} ({p.status})
              </option>
            ))}
          </optgroup>
        </select>
      </label>
      <label>
        Result
        <select value={result} disabled={disabled || !target} onChange={(e) => setResult(e.target.value)}>
          <option value="">Choose...</option>
          {results.map((r) => (
            <option key={r} value={r}>
              {labels[r]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Inspector
        <input
          value={inspector}
          disabled={disabled}
          placeholder="Name or ID"
          onChange={(e) => setInspector(e.target.value)}
        />
      </label>
      {kind === 'package' && (
        <label>
          Product temperature (°C)
          <input type="number" step="0.1" value={temp} placeholder="e.g. -18" onChange={(e) => setTemp(e.target.value)} />
        </label>
      )}
      <label>
        Note
        <input value={note} disabled={disabled} placeholder="Optional" onChange={(e) => setNote(e.target.value)} />
      </label>
      <button type="submit" disabled={disabled || !target || !result}>
        Record inspection
      </button>
    </form>
  );
}

const KIND_LABELS = {
  regulation: 'Qatari law / regulation',
  international: 'International standard',
  guidance: 'Official guidance',
  research: 'Research',
  'foreign regulation': 'Foreign regulation',
  policy: 'Policy setting',
};

// "Based on" sources as chips; clicking one shows the wording of that law or standard.
function BasisList({ keys }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="basis">
      <span>Based on:</span>
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          className={`basis-chip ${open === key ? 'open' : ''}`}
          aria-expanded={open === key}
          onClick={() => setOpen(open === key ? null : key)}
        >
          {SOURCE_TEXT[key]?.title ?? KNOWLEDGE[key]?.source ?? key}
        </button>
      ))}
      {open && <SourcePanel knowledgeKey={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function SourcePanel({ knowledgeKey, onClose }) {
  const entry = KNOWLEDGE[knowledgeKey] ?? {};
  const text = SOURCE_TEXT[knowledgeKey];
  return (
    <div className="source-panel" role="region" aria-label="Source text">
      <div className="source-head">
        <span className={`source-kind kind-${(entry.kind ?? '').replace(' ', '-')}`}>
          {KIND_LABELS[entry.kind] ?? entry.kind}
        </span>
        <button type="button" className="source-close" onClick={onClose} aria-label="Close source">
          ×
        </button>
      </div>
      {text?.quoteAr && (
        <blockquote dir="rtl" lang="ar" className="source-quote arabic">
          {text.quoteAr}
        </blockquote>
      )}
      {text?.summary && <p className="source-summary">{text.summary}</p>}
      {text?.quote ? (
        <>
          {text.translated && <div className="source-label">Unofficial English translation</div>}
          <blockquote className="source-quote">{text.quote}</blockquote>
        </>
      ) : text?.summary ? null : (
        <p className="source-note">
          {entry.kind === 'policy'
            ? `A PeckTag operating setting (value: ${entry.value}), not a law. It can be changed by the operator or regulator.`
            : 'No quoted text stored for this source.'}
        </p>
      )}
      {entry.source && <div className="source-ref">Source: {entry.source}</div>}
      {entry.note && <div className="source-note">How PeckTag uses it: {entry.note}</div>}
      {text?.url && (
        <a className="source-link" href={text.url} target="_blank" rel="noopener noreferrer">
          Open the source ↗
        </a>
      )}
    </div>
  );
}

function Legend() {
  return (
    <div className="legend">
      <span className="chip pkg-ok">clear</span>
      <span className="chip pkg-held">held</span>
      <span className="chip pkg-withdrawn">withdrawn</span>
      <span>❄️ thaw detected</span>
    </div>
  );
}
