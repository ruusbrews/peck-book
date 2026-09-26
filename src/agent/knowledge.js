// Domain knowledge the agent reasons with. The numbers are prototype settings and
// should be replaced with lab-calibrated values for the real PeckTag strip.

// Custody stages in Qatar's domestic chain, in the order a package should pass them.
export const STAGES = { port: 0, wholesale: 1, retail: 2 };

export const SETTINGS = {
  suspectThreshold: 2, // thaw incidents traced to one location before it is investigated
  nearExpiryDays: 3, // clean stock this close to expiry is sold first
  minReadConfidence: 0.6, // below this the strip photo must be retaken
};

export const ACTIONS = {
  CONTINUE: 'CONTINUE',
  RESCAN: 'RESCAN',
  PRIORITIZE_SALE: 'PRIORITIZE_SALE',
  INSPECT: 'INSPECT',
  HOLD_FOR_INSPECTION: 'HOLD_FOR_INSPECTION',
  RELEASE: 'RELEASE',
  WITHDRAW: 'WITHDRAW',
  ESCALATE: 'ESCALATE_TO_AUTHORITY',
};

// Actions that let a package keep moving toward sale.
export const SELLABLE = new Set([ACTIONS.CONTINUE, ACTIONS.PRIORITIZE_SALE, ACTIONS.RELEASE]);

// The agent's desires, most important first. The plan library in agent.js is
// ordered so that earlier desires win when they conflict.
export const DESIRES = [
  'Keep unsafe product off shelves',
  'Find where the cold chain broke',
  'Avoid discarding product that is still good',
  'Keep clean stock moving',
];
