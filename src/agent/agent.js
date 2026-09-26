import { ACTIONS, ACTION_BASIS, DESIRES, KNOWLEDGE, SELLABLE, SETTINGS, STAGES } from './knowledge.js';

const DAY_MS = 24 * 60 * 60 * 1000;

// Plan library. The first plan whose context holds is chosen. Plans that act on a
// package's own strip evidence come before plans that act on suspicion of a location.
const PLANS = [
  {
    name: 'withdraw-spoiled',
    when: ({ scan }) => scan.thaw && scan.ph === 'spoiled',
    act: ({ why }) => ({
      action: ACTIONS.WITHDRAW,
      reasons: [...why('thaw', 'ph'), 'Pulled from sale; lab analysis and any destruction are for the authority'],
      holds: ['evidence'],
    }),
  },
  {
    name: 'escalate-tampering',
    when: ({ facts }) => facts.has('unregistered') || facts.has('stripReset') || facts.has('duplicateId'),
    act: ({ why }) => ({
      action: ACTIONS.ESCALATE,
      reasons: why('unregistered', 'stripReset', 'duplicateId'),
      holds: ['evidence'],
    }),
  },
  {
    name: 'inspect-thawed',
    when: ({ scan }) => scan.thaw,
    act: ({ why }) => ({ action: ACTIONS.INSPECT, reasons: why('thaw', 'ph'), holds: ['evidence'] }),
  },
  {
    name: 'inspect-spoilage',
    when: ({ scan }) => scan.ph === 'spoiled',
    act: ({ why }) => ({ action: ACTIONS.INSPECT, reasons: why('ph'), holds: ['evidence'] }),
  },
  {
    name: 'hold-investigated',
    when: ({ investigations }) => investigations.length > 0,
    act: ({ investigations }) => ({
      action: ACTIONS.HOLD_FOR_INSPECTION,
      reasons: investigations.map((i) => `Passed through ${i.location}, which is under investigation`),
      holds: investigations.map((i) => i.key),
    }),
  },
  {
    name: 'inspect-custody-anomaly',
    when: ({ facts }) => facts.has('gap') || facts.has('reverseFlow') || facts.has('gpsMismatch'),
    act: ({ why }) => ({
      action: ACTIONS.INSPECT,
      reasons: why('gap', 'reverseFlow', 'gpsMismatch'),
      holds: ['evidence'],
    }),
  },
  {
    name: 'sell-first',
    when: ({ facts }) => facts.has('ph') || facts.has('nearExpiry'),
    act: ({ why }) => ({ action: ACTIONS.PRIORITIZE_SALE, reasons: why('ph', 'nearExpiry') }),
  },
  {
    name: 'continue',
    when: () => true,
    act: () => ({ action: ACTIONS.CONTINUE, reasons: ['Strip and custody record are clean'] }),
  },
];

// Great-circle distance in km between two { lat, lng } points.
function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const h =
    Math.sin(rad(b.lat - a.lat) / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function newPackage(id, fields) {
  return {
    id,
    batchId: null,
    expiry: null,
    registered: false,
    scans: [],
    holds: new Set(), // 'evidence' or an intention key such as 'investigate:wholesale-b'
    status: 'ok', // ok | held | withdrawn
    breach: null, // where the thaw happened: after the scan at `after`, before the scan at `before`
    ...fields,
  };
}

// BDI agent for PeckTag custody scans.
// Beliefs: packages, locations and their incident history.
// Desires: DESIRES in knowledge.js.
// Intentions: ongoing commitments (e.g. investigating a location) that shape later decisions
// until an inspection result resolves them.
export class PeckAgent {
  constructor(locations, settings = {}) {
    this.settings = { ...SETTINGS, ...settings };
    this.packages = new Map();
    this.locations = new Map(
      // incidents: recent thaws traced here; violations: confirmed by past inspections
      locations.map((loc) => [loc.id, { ...loc, status: 'trusted', incidents: [], violations: 0 }]),
    );
    this.intentions = new Map();
    this.trace = [];
  }

  // Perceive, update beliefs, deliberate, act. Returns the decisions this event produced.
  handle(event) {
    if (event.type === 'register') return this.onRegister(event);
    if (event.type === 'scan') return this.onScan(event);
    if (event.type === 'inspection') {
      return event.packageId ? this.onPackageInspection(event) : this.onLocationInspection(event);
    }
    throw new Error(`Unknown event type: ${event.type}`);
  }

  onRegister({ packageId, batchId, expiry, location, time }) {
    this.packages.set(packageId, newPackage(packageId, { batchId, expiry, registered: true }));
    this.note(time, 'belief', `${packageId} registered at ${location} (batch ${batchId}, expires ${expiry})`);
    return [];
  }

  onScan(scan) {
    const { packageId, time } = scan;
    const location = this.location(scan.location);

    if (scan.readConfidence < this.settings.minReadConfidence) {
      return [
        this.decide(time, packageId, {
          action: ACTIONS.RESCAN,
          reasons: ['Strip photo too unclear to read; retake it'],
        }),
      ];
    }

    const facts = new Map();
    let pkg = this.packages.get(packageId);
    if (!pkg) {
      pkg = newPackage(packageId, {});
      this.packages.set(packageId, pkg);
      facts.set('unregistered', `${packageId} was never registered at the port; possible repackaging`);
    }

    const prev = pkg.scans.at(-1);
    pkg.scans.push(scan);
    let newBreach = false;

    if (prev) {
      const step = STAGES[location.stage] - STAGES[this.location(prev.location).stage];
      if (step > 1) facts.set('gap', `No custody scan between ${prev.location} and ${location.id}`);
      if (step < 0) facts.set('reverseFlow', `Moved backwards in the chain, from ${prev.location} to ${location.id}`);
      if (step === 0 && location.stage === 'retail' && prev.location !== location.id) {
        facts.set('duplicateId', `Already received at ${prev.location}; the same ID at a second shop suggests a cloned label`);
      }
    }
    if (scan.gps && location.coords) {
      const km = distanceKm(scan.gps, location.coords);
      if (km > this.settings.maxGpsDistanceKm) {
        facts.set('gpsMismatch', `Scan claims ${location.id} but the phone was ${km.toFixed(1)} km away`);
      }
    }

    if (scan.thaw && !pkg.breach) {
      pkg.breach = { after: prev?.location ?? null, before: location.id, from: prev?.time ?? null, to: time };
      facts.set(
        'thaw',
        prev
          ? `Thaw square triggered; last clean scan was at ${prev.location}, so the break happened there or in transit to ${location.id}`
          : 'Thaw square already triggered at first scan',
      );
      newBreach = Boolean(prev);
    } else if (scan.thaw) {
      facts.set('thaw', `Thaw square still triggered (first seen at ${pkg.breach.before})`);
    } else if (pkg.breach) {
      facts.set('stripReset', 'Thaw square reads clear after it had triggered; the strip may have been replaced');
    }

    if (scan.ph !== 'fresh') facts.set('ph', `pH square reads ${scan.ph}`);
    if (pkg.expiry && Date.parse(pkg.expiry) - Date.parse(time) <= this.settings.nearExpiryDays * DAY_MS) {
      facts.set('nearExpiry', `Expires ${pkg.expiry}`);
    }
    for (const text of facts.values()) this.note(time, 'belief', `${pkg.id}: ${text}`);
    const incidentDecisions = newBreach ? this.recordIncident(prev.location, pkg.id, time) : [];

    const context = {
      scan,
      facts,
      investigations: this.investigationsFor(pkg),
      why: (...keys) => keys.filter((k) => facts.has(k)).map((k) => facts.get(k)),
    };
    const plan = PLANS.find((p) => p.when(context));
    const proposal = plan.act(context);
    this.note(time, 'plan', `${pkg.id}: plan "${plan.name}"`);
    for (const key of proposal.holds ?? []) pkg.holds.add(key);

    return [this.decide(time, pkg.id, this.enforce(pkg, proposal, time)), ...incidentDecisions];
  }

  // A thaw traced back to a location. Enough recent ones and the agent commits to investigating it;
  // a location with a confirmed past violation needs fewer.
  recordIncident(locationId, packageId, time) {
    const loc = this.location(locationId);
    const cutoff = Date.parse(time) - this.settings.incidentWindowDays * DAY_MS;
    loc.incidents = loc.incidents.filter((i) => Date.parse(i.time) >= cutoff && i.packageId !== packageId);
    loc.incidents.push({ packageId, time });
    const ids = loc.incidents.map((i) => i.packageId);
    this.note(time, 'belief', `${loc.id} linked to ${ids.length} recent thaw incident(s): ${ids.join(', ')}`);

    const threshold = loc.violations
      ? this.settings.repeatOffenderThreshold
      : this.settings.suspectThreshold;
    if (loc.violations) this.note(time, 'belief', `${loc.id} has ${loc.violations} confirmed past violation(s)`);

    const key = `investigate:${loc.id}`;
    if (ids.length < threshold || this.intentions.has(key)) return [];
    return this.adoptInvestigation(loc, key, packageId, time);
  }

  adoptInvestigation(loc, key, currentPackageId, time) {
    loc.status = 'suspect';
    this.intentions.set(key, { key, type: 'investigate', location: loc.id, since: time });
    this.note(time, 'intention', `Committed to investigating ${loc.id} until an inspection resolves it`);

    const decisions = [
      this.decide(
        time,
        loc.id,
        {
          action: ACTIONS.INSPECT,
          reasons: [
            `${loc.incidents.length} package(s) first showed thaw after leaving ${loc.id}` +
              (loc.violations ? ` (repeat offender: ${loc.violations} confirmed violation(s))` : ''),
          ],
        },
        'location',
      ),
    ];
    // Hold everything that passed through the suspect location, including stock whose strip still looks clean.
    for (const pkg of this.packages.values()) {
      if (!pkg.scans.some((s) => s.location === loc.id)) continue;
      const alreadyHeld = pkg.status !== 'ok';
      pkg.holds.add(key);
      if (alreadyHeld || pkg.id === currentPackageId) continue;
      decisions.push(
        this.decide(time, pkg.id, {
          action: ACTIONS.HOLD_FOR_INSPECTION,
          reasons: [`Passed through ${loc.id}, which is now under investigation`],
        }),
      );
    }
    return decisions;
  }

  onLocationInspection({ location: locationId, result, time, note }) {
    const loc = this.location(locationId);
    const key = `investigate:${loc.id}`;
    this.note(time, 'belief', `Inspection of ${loc.id}: ${result}${note ? ` (${note})` : ''}`);

    if (result === 'confirmed') {
      // Keep the intention so stock still arriving from here stays held.
      loc.status = 'confirmed';
      loc.violations += 1;
      this.note(time, 'intention', `Keeping holds on stock from ${loc.id} and escalating`);
      return [
        this.decide(
          time,
          loc.id,
          {
            action: ACTIONS.ESCALATE,
            reasons: [`Inspection confirmed cold-chain violations at ${loc.id}`],
            evidence: loc.incidents.map(({ packageId }) => ({ packageId, ...this.packages.get(packageId).breach })),
          },
          'location',
        ),
      ];
    }

    loc.status = 'trusted';
    loc.incidents = [];
    this.intentions.delete(key);
    this.note(time, 'intention', `Dropped investigation of ${loc.id}; releasing holds that depended on it`);

    const decisions = [];
    for (const pkg of this.packages.values()) {
      const dependedOnIt = pkg.holds.delete(key);
      if (!dependedOnIt || pkg.holds.size || pkg.status === 'withdrawn') continue;
      const proposal = { action: ACTIONS.RELEASE, reasons: [`${loc.id} cleared by inspection`] };
      decisions.push(this.decide(time, pkg.id, this.enforce(pkg, proposal, time)));
    }
    return decisions;
  }

  onPackageInspection({ packageId, result, time, note }) {
    const pkg = this.package(packageId);
    this.note(time, 'belief', `Inspection of ${pkg.id}: ${result}${note ? ` (${note})` : ''}`);
    if (result === 'fail') {
      return [this.decide(time, pkg.id, { action: ACTIONS.WITHDRAW, reasons: ['Failed inspection'] })];
    }

    pkg.holds.delete('evidence');
    const last = pkg.scans.at(-1);
    let proposal;
    if (pkg.holds.size) {
      proposal = {
        action: ACTIONS.HOLD_FOR_INSPECTION,
        reasons: ['Passed inspection but still linked to a location under investigation'],
      };
    } else if (pkg.breach || last?.ph !== 'fresh') {
      proposal = {
        action: ACTIONS.PRIORITIZE_SALE,
        reasons: ['Passed inspection; quality is reduced, so sell before other stock'],
      };
    } else {
      proposal = { action: ACTIONS.RELEASE, reasons: ['Passed inspection'] };
    }
    return [this.decide(time, pkg.id, this.enforce(pkg, proposal, time))];
  }

  // Hard safety rules. They sit outside the plan library so that no plan, and no
  // learned policy added later, can override them.
  enforce(pkg, proposal, time) {
    const last = pkg.scans.at(-1);
    let forced = null;
    if (pkg.status === 'withdrawn' || (last?.thaw && last.ph === 'spoiled')) {
      forced = {
        action: ACTIONS.WITHDRAW,
        reasons: ['Safety rule: thawed-and-spoiled or withdrawn stock never returns to sale'],
      };
    } else if (SELLABLE.has(proposal.action) && pkg.holds.size) {
      forced = {
        action: ACTIONS.HOLD_FOR_INSPECTION,
        reasons: [`Safety rule: open holds (${[...pkg.holds].join(', ')}) block sale`],
      };
    }
    if (!forced || forced.action === proposal.action) return proposal;
    this.note(time, 'constraint', `${pkg.id}: ${proposal.action} overridden to ${forced.action}`);
    return forced;
  }

  decide(time, target, { action, reasons, evidence }, targetType = 'package') {
    const pkg = targetType === 'package' ? this.packages.get(target) : null;
    if (pkg && action !== ACTIONS.RESCAN) {
      pkg.status = action === ACTIONS.WITHDRAW ? 'withdrawn' : SELLABLE.has(action) ? 'ok' : 'held';
    }
    this.note(time, 'decision', `${target} -> ${action}: ${reasons.join('; ')}`);
    const basis = (ACTION_BASIS[action] ?? []).map((key) => ({ key, source: KNOWLEDGE[key].source ?? 'policy' }));
    return { time, target, targetType, action, reasons, basis, ...(evidence && { evidence }) };
  }

  investigationsFor(pkg) {
    const visited = new Set(pkg.scans.map((s) => s.location));
    return [...this.intentions.values()].filter((i) => i.type === 'investigate' && visited.has(i.location));
  }

  location(id) {
    const loc = this.locations.get(id);
    if (!loc) throw new Error(`Unknown location: ${id}`);
    return loc;
  }

  package(id) {
    const pkg = this.packages.get(id);
    if (!pkg) throw new Error(`Unknown package: ${id}`);
    return pkg;
  }

  note(time, kind, text) {
    this.trace.push({ time, kind, text });
  }

  // Plain-object snapshot for the dashboard or for saving to Firestore.
  getState() {
    return {
      desires: DESIRES,
      intentions: [...this.intentions.values()],
      locations: [...this.locations.values()].map((l) => ({ ...l, incidents: l.incidents.map((i) => ({ ...i })) })),
      packages: [...this.packages.values()].map((p) => ({ ...p, holds: [...p.holds], scans: [...p.scans] })),
    };
  }
}
