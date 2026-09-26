import { useCallback, useEffect, useMemo, useState } from 'react';
import { PeckAgent } from './agent/agent.js';
import { ACTIONS, STAGES } from './agent/knowledge.js';
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

// Replays the scenario from the start so stepping back is exact.
function replay(steps, upto) {
  const agent = new PeckAgent(LOCATIONS);
  let current = { trace: [], decisions: [] };
  for (let i = 0; i <= upto; i++) {
    const start = agent.trace.length;
    const decisions = steps[i].events.flatMap((e) => agent.handle(e));
    current = { trace: agent.trace.slice(start), decisions };
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
  const [outcome, setOutcome] = useState('clear');
  const [step, setStep] = useState(-1);

  const steps = useMemo(() => buildSteps(demoEvents(outcome)), [outcome]);
  const { state, current } = useMemo(() => replay(steps, step), [steps, step]);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, steps.length - 1)), [steps.length]);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, -1)), []);

  useEffect(() => {
    const onKey = (e) => {
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
          <label className="outcome">
            Inspector finds Wholesale B:
            <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              <option value="clear">cleared</option>
              <option value="confirmed">in violation</option>
            </select>
          </label>
          <button onClick={() => setStep(-1)}>Reset</button>
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
      {basis.length > 0 && (
        <div className="basis">Based on: {[...new Set(basis.map((b) => b.source))].join(' · ')}</div>
      )}
    </article>
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
