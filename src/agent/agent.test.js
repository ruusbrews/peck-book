import { describe, expect, test } from 'vitest';
import { PeckAgent } from './agent.js';
import { ACTIONS } from './knowledge.js';
import { LOCATIONS, demoEvents } from './simulator.js';

const T = '2026-10-01T09:00:00Z';
const clean = { thaw: false, ph: 'fresh', readConfidence: 0.95 };

function run(events) {
  const agent = new PeckAgent(LOCATIONS);
  const decisions = events.flatMap((e) => agent.handle(e));
  return { agent, decisions };
}

const lastFor = (decisions, target) => decisions.filter((d) => d.target === target).at(-1)?.action;

const register = (packageId, expiry = '2027-03-01') => ({
  type: 'register',
  packageId,
  batchId: 'B1',
  expiry,
  location: 'hamad-port',
  time: T,
});
const scan = (packageId, location, strip = {}) => ({ type: 'scan', packageId, location, time: T, ...clean, ...strip });

describe('demo scenario', () => {
  test('clean stock from a suspect wholesaler is held, then released when it is cleared', () => {
    const events = demoEvents('clear');
    const agent = new PeckAgent(LOCATIONS);
    const beforeInspection = events.findIndex((e) => e.type === 'inspection');
    const early = events.slice(0, beforeInspection).flatMap((e) => agent.handle(e));

    expect(lastFor(early, 'wholesale-b')).toBe(ACTIONS.INSPECT);
    expect(lastFor(early, 'PKG-003')).toBe(ACTIONS.HOLD_FOR_INSPECTION);
    expect(lastFor(early, 'PKG-004')).toBe(ACTIONS.HOLD_FOR_INSPECTION);
    // Same batch through a different wholesaler is not held: no batch-wide discard.
    expect(lastFor(early, 'PKG-005')).toBe(ACTIONS.PRIORITIZE_SALE);
    expect(lastFor(early, 'PKG-006')).toBe(ACTIONS.CONTINUE);
    expect(lastFor(early, 'PKG-X99')).toBe(ACTIONS.ESCALATE);

    const late = events.slice(beforeInspection).flatMap((e) => agent.handle(e));
    expect(lastFor(late, 'PKG-003')).toBe(ACTIONS.RELEASE);
    expect(lastFor(late, 'PKG-001')).toBe(ACTIONS.PRIORITIZE_SALE);
    expect(lastFor(late, 'PKG-002')).toBe(ACTIONS.WITHDRAW);
    expect(agent.intentions.size).toBe(0);
  });

  test('a confirmed violation is escalated with evidence and holds stay in place', () => {
    const { agent, decisions } = run(demoEvents('confirmed'));
    const escalation = decisions.find((d) => d.target === 'wholesale-b' && d.action === ACTIONS.ESCALATE);

    expect(escalation.evidence.map((e) => e.packageId)).toEqual(['PKG-001', 'PKG-002']);
    expect(escalation.evidence[0]).toMatchObject({ after: 'wholesale-b', before: 'shop-1' });
    expect(lastFor(decisions, 'PKG-001')).toBe(ACTIONS.HOLD_FOR_INSPECTION);
    expect(agent.packages.get('PKG-003').status).toBe('held');
  });
});

describe('single-package reasoning', () => {
  test('one thaw incident flags the package but does not open an investigation', () => {
    const { agent, decisions } = run([
      register('P1'),
      scan('P1', 'hamad-port'),
      scan('P1', 'wholesale-b'),
      scan('P1', 'shop-1', { thaw: true }),
    ]);
    expect(lastFor(decisions, 'P1')).toBe(ACTIONS.INSPECT);
    expect(agent.packages.get('P1').breach).toMatchObject({ after: 'wholesale-b', before: 'shop-1' });
    expect(agent.intentions.size).toBe(0);
  });

  test('thawed and spoiled stock is withdrawn and a passed inspection cannot bring it back', () => {
    const { decisions } = run([
      register('P1'),
      scan('P1', 'hamad-port'),
      scan('P1', 'wholesale-a', { thaw: true, ph: 'spoiled' }),
      { type: 'inspection', packageId: 'P1', result: 'pass', time: T },
    ]);
    expect(decisions.map((d) => d.action)).toEqual([ACTIONS.CONTINUE, ACTIONS.WITHDRAW, ACTIONS.WITHDRAW]);
  });

  test('a thaw square that reads clear again is treated as a replaced strip', () => {
    const { decisions } = run([
      register('P1'),
      scan('P1', 'hamad-port'),
      scan('P1', 'wholesale-a', { thaw: true }),
      scan('P1', 'shop-1'),
    ]);
    expect(lastFor(decisions, 'P1')).toBe(ACTIONS.ESCALATE);
  });

  test('skipping the wholesale checkpoint triggers an inspection', () => {
    const { decisions } = run([register('P1'), scan('P1', 'hamad-port'), scan('P1', 'shop-1')]);
    expect(lastFor(decisions, 'P1')).toBe(ACTIONS.INSPECT);
  });

  test('an unclear strip photo asks for a rescan without changing beliefs', () => {
    const { agent, decisions } = run([register('P1'), scan('P1', 'hamad-port', { readConfidence: 0.3 })]);
    expect(lastFor(decisions, 'P1')).toBe(ACTIONS.RESCAN);
    expect(agent.packages.get('P1').scans).toHaveLength(0);
  });

  test('a scan far from its claimed facility is inspected', () => {
    const nearWholesaleB = { lat: 25.168, lng: 51.598 };
    const { decisions } = run([
      register('P1'),
      scan('P1', 'hamad-port'),
      scan('P1', 'wholesale-a'),
      scan('P1', 'shop-1', { gps: nearWholesaleB }),
    ]);
    expect(lastFor(decisions, 'P1')).toBe(ACTIONS.INSPECT);
    expect(decisions.at(-1).reasons[0]).toMatch(/km away/);
  });

  test('a scan within range of its facility passes the GPS check', () => {
    const { decisions } = run([
      register('P1'),
      scan('P1', 'hamad-port', { gps: { lat: 25.013, lng: 51.606 } }),
    ]);
    expect(lastFor(decisions, 'P1')).toBe(ACTIONS.CONTINUE);
  });

  test('stock moving back up the chain is inspected', () => {
    const { decisions } = run([
      register('P1'),
      scan('P1', 'hamad-port'),
      scan('P1', 'wholesale-a'),
      scan('P1', 'shop-1'),
      scan('P1', 'wholesale-b'),
    ]);
    expect(lastFor(decisions, 'P1')).toBe(ACTIONS.INSPECT);
  });

  test('the same package ID at a second shop is escalated as a cloned label', () => {
    const { decisions } = run([
      register('P1'),
      scan('P1', 'hamad-port'),
      scan('P1', 'wholesale-a'),
      scan('P1', 'shop-1'),
      scan('P1', 'shop-2'),
    ]);
    expect(lastFor(decisions, 'P1')).toBe(ACTIONS.ESCALATE);
  });

  test('a borderline pH reading on clean stock means sell first, not discard', () => {
    const { decisions } = run([register('P1'), scan('P1', 'hamad-port', { ph: 'borderline' })]);
    expect(lastFor(decisions, 'P1')).toBe(ACTIONS.PRIORITIZE_SALE);
  });
});

describe('location reputation', () => {
  const at = (day) => `2026-10-${String(day).padStart(2, '0')}T09:00:00Z`;
  const thawVia = (id, day) => [
    { ...register(id), time: at(day) },
    { ...scan(id, 'wholesale-b'), time: at(day) },
    { ...scan(id, 'shop-1', { thaw: true }), time: at(day + 1) },
  ];

  test('a location with a confirmed violation is investigated after a single incident', () => {
    const { agent, decisions } = run([
      ...thawVia('P1', 1),
      ...thawVia('P2', 1),
      { type: 'inspection', location: 'wholesale-b', result: 'confirmed', time: at(3) },
      { type: 'inspection', location: 'wholesale-b', result: 'clear', time: at(4) },
      ...thawVia('P3', 5),
    ]);
    const inspections = decisions.filter((d) => d.target === 'wholesale-b' && d.action === ACTIONS.INSPECT);
    expect(inspections).toHaveLength(2);
    expect(inspections[1].reasons[0]).toMatch(/repeat offender/);
    expect(agent.locations.get('wholesale-b').violations).toBe(1);
  });

  test('incidents older than the window do not add up', () => {
    const { agent } = run([...thawVia('P1', 1), ...thawVia('P2', 20)]);
    expect(agent.intentions.size).toBe(0);
    expect(agent.locations.get('wholesale-b').incidents.map((i) => i.packageId)).toEqual(['P2']);
  });
});
