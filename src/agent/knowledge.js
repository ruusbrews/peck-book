// Domain knowledge the agent reasons with. Every entry records where it comes from:
//   regulation    - binding law or technical regulation
//   international - international standard (FAO/WHO Codex): guidance, not Qatari law
//   guidance      - official advice from an authority (not binding law)
//   research   - a published study; the real PeckTag strip must be calibrated in the lab
//   policy     - an operating choice, not a fact; a prototype default the operator can change
// `verified: true` means the team read the cited primary source (checked Sep 2026).

// Custody stages in Qatar's domestic chain, in the order a package should pass them.
export const STAGES = { port: 0, wholesale: 1, retail: 2 };

export const KNOWLEDGE = {
  // --- Regulation and guidance ---
  frozenStorageMaxC: {
    value: -18,
    kind: 'international',
    verified: true,
    source: 'Codex CXC 8-1976, Code of Practice for Quick Frozen Foods, s.2 and s.4.6',
    note: 'Quick frozen food must be kept at -18 C or colder at all points in the cold chain. MOPH Qatar public guidance (31 Mar 2026) repeats -18 C for frozen products.',
  },
  frozenAbsoluteMaxC: {
    value: -12,
    kind: 'international',
    verified: true,
    source: 'Codex CXC 8-1976, s.4.7 and s.4.9',
    note: 'Short rises above -18 C are tolerated in distribution and retail, but never warmer than -12 C in the warmest package. The thaw square should trigger well before 0 C to respect this.',
  },
  frozenPoultryShelfLife: {
    value: 'set by the producer and backed by a stability study; no fixed maximum',
    kind: 'regulation',
    verified: true,
    source: 'Qatar Technical Regulation QS 10050:2025 Shelf Life of Food Products (Minister of Commerce and Industry Decision No. 102 of 2025, 29 Sep 2025), s.4/5 and Annexes 2-3; replaces GSO 150-1:2013 and GSO 150-2:2013 in Qatar',
    note: 'The mandatory table lists chilled meat and poultry but not frozen poultry. Producers and importers are legally responsible for the declared shelf life and the authority may demand the scientific justification. GSO 150 (12 months for frozen chicken in the 2007 edition) is now only a guidance reference, per the note on the s.4/5/6 table.',
  },
  dateLabelIntegrity: {
    value: [
      'production and expiry dates engraved, embossed, printed or stamped directly on the pack, so they cannot be removed or changed',
      'not handwritten and not on removable stickers',
      'no alteration or addition to the dates by extra stickers or any other method',
      'only one production date and one expiry date per pack',
    ],
    kind: 'regulation',
    verified: true,
    source: 'QS 10050:2025, s.4/3/1-4/3/4 and s.4/4',
    note: 'Relabelling or repackaging with new dates is a direct violation. Legal basis for escalating unregistered packages, swapped strips and cloned IDs.',
  },
  unfitForConsumption: {
    value: [
      'chemical or microbial analysis proves a change, or taste/appearance/smell has changed',
      'expiry date on the label has passed',
      'stored in unsanitary conditions',
    ],
    kind: 'regulation',
    verified: true,
    source: 'Qatar Law No. 8 of 1990 on Regulation of Human Food Control (in force, amended by Law No. 4 of 2014 and Law No. 20 of 2017), Art. 4',
    note: 'A strip reading is evidence, not the analysis the law requires, so the agent holds and inspects rather than declaring food unfit.',
  },
  postCustomsOversight: {
    value: 'MOPH, the municipal ministry and municipalities monitor imported food after customs release: in transport, stores, warehouses and shops',
    kind: 'regulation',
    verified: true,
    source: 'Qatar Law No. 8 of 1990, Art. 7 (as amended by Law No. 4 of 2014)',
    note: 'The legal basis for PeckTag working after arrival in Qatar, and for escalating to these authorities.',
  },
  inspectorPowers: {
    value: 'Officers may enter premises and vehicles, check records, take samples and temporarily seize suspected food; destruction follows analysis',
    kind: 'regulation',
    verified: true,
    source: 'Qatar Law No. 8 of 1990, Art. 19, 20 and 23',
    note: 'The agent escalates with evidence; seizure and destruction stay with the authority.',
  },
  refreezingThawed: {
    value: 'avoid',
    kind: 'guidance',
    verified: true,
    source: 'MOPH Qatar guidance on handling raw food, reported by The Peninsula, 31 Mar 2026',
    note: 'USDA FSIS says food thawed in a refrigerator can be refrozen safely but loses quality, so a thaw is a quality and custody issue first, not automatically a safety verdict.',
  },
  temperatureViolationProcedure: {
    value: 'identify and sort affected loads, suspend delivery and sale, assess safety and quality, inform the supplier and chain, notify the competent authority if safety is compromised',
    kind: 'international',
    verified: true,
    source: 'Codex CXC 8-1976, s.5.3',
    note: 'The basis for the HOLD, INSPECT and ESCALATE actions.',
  },
  stockRotation: {
    value: 'first in, first out, or shortest durability date first',
    kind: 'international',
    verified: true,
    source: 'Codex CXC 8-1976, s.4.6 and s.4.9',
    note: 'The basis for PRIORITIZE_SALE of stock close to expiry.',
  },
  transferPointRecords: {
    value: 'check product temperature when received or dispatched, keep records longer than the shelf life',
    kind: 'international',
    verified: true,
    source: 'Codex CXC 8-1976, s.4.8 and s.5.4',
    note: 'The basis for scanning at every change of custody.',
  },
  indicatorsOnRetailPacks: {
    value: 'caution',
    kind: 'international',
    verified: true,
    source: 'Codex CXC 8-1976, Annex s.4.4',
    note: 'Codex notes reluctance to use time-temperature indicators on retail packs (surface placement, possible conflict with durability dates) but supports them on cartons and pallets. Be ready for this question.',
  },

  // --- Research: reference points for calibrating the strip ---
  tvbnLegalLimit: {
    value: 15,
    unit: 'mg TVB-N / 100 g',
    kind: 'foreign regulation',
    verified: true,
    source: 'China GB 2707-2016, National Food Safety Standard for Fresh and Frozen Livestock and Poultry Products, s.3.3 Table 2 (read in the unofficial USDA FAS translation, GAIN CH19010, 2019)',
    note: 'A foreign compliance limit, not a Qatar/GCC rule. Useful as a reference point for calibrating the pH square.',
  },
  tvbnSpoilageRange: {
    value: { from: 15, to: 25 },
    unit: 'mg TVB-N / 100 g',
    kind: 'research',
    verified: false,
    source: 'TVB-N review literature (e.g. Bekhit et al. 2021, Trends in Food Science & Technology)',
    note: 'Critical range reported across studies; chicken was judged unacceptable above ~28 mg/100 g in Ahmed et al. 2024.',
  },
  anthocyaninIndicatorOnChicken: {
    value: {
      fresh: { tvbn: 3.6, pH: 7.03, colour: 'dark pink to red' },
      borderline: { tvbn: 13.6, pH: 7.72 },
      spoiled: { tvbn: 28.2, pH: 8.12, colour: 'dark blue then pale green' },
    },
    kind: 'research',
    verified: true,
    source: 'Ahmed, Bose, Nousheen and Roy (2024), International Journal of Biomaterials, PMC10994710',
    note: 'Chicken spoiled at 30 C, not frozen. Used only as evidence that anthocyanin colour tracks spoilage; its pH scale differs from PeckTag\'s, which uses pecktagPhGrades.',
  },
  pecktagPhGrades: {
    value: {
      fresh: { min: 5.7, max: 6.1 },
      borderline: { above: 6.1, max: 6.8 },
      spoiled: { above: 6.8 },
    },
    unit: 'pH',
    kind: 'research',
    verified: false,
    source: 'Miao et al. (2023), Exopolysaccharide riclin and anthocyanin-based composite colorimetric indicator film for food freshness monitoring, Carbohydrate Polymers 314, 120882: purple sweet potato anthocyanin in PVA/riclin film',
    note: 'Ranges set by the PeckTag team from this film. Paper citation checked; its full text (and so these exact ranges) was not accessible. Readings below 5.7 count as fresh.',
  },
  irreversibleThawIndicators: {
    value: 'colour changes as the sample warms towards 0 C and does not revert when refrozen',
    kind: 'research',
    verified: false,
    source: 'Commercial freeze-thaw indicators (e.g. Biosynergy StaFreez) and thaw-indicator patents such as US6357383B1',
    note: 'Shows the thaw-square concept exists. Product claims were seen via search listings only.',
  },

  // --- Policy: prototype defaults, set by the operator or regulator ---
  suspectThreshold: {
    value: 2,
    kind: 'policy',
    note: 'Thaw incidents traced to one location before it is investigated.',
  },
  repeatOffenderThreshold: {
    value: 1,
    kind: 'policy',
    note: 'Same, for a location with a confirmed past violation.',
  },
  incidentWindowDays: {
    value: 14,
    kind: 'policy',
    note: 'Older incidents no longer count toward suspicion.',
  },
  maxGpsDistanceKm: {
    value: 1,
    kind: 'policy',
    note: 'A scan further than this from its claimed facility is suspicious.',
  },
  nearExpiryDays: {
    value: 3,
    kind: 'policy',
    note: 'Clean stock this close to expiry is sold first (applies stockRotation).',
  },
  minReadConfidence: {
    value: 0.6,
    kind: 'policy',
    note: 'Below this the strip photo must be retaken.',
  },
};

// Grades a numeric pH reading using the PeckTag ranges.
export function phGrade(pH) {
  const { fresh, borderline } = KNOWLEDGE.pecktagPhGrades.value;
  if (pH <= fresh.max) return 'fresh';
  if (pH <= borderline.max) return 'borderline';
  return 'spoiled';
}

// Plain values for the agent, e.g. SETTINGS.suspectThreshold === 2.
export const SETTINGS = Object.fromEntries(Object.entries(KNOWLEDGE).map(([key, entry]) => [key, entry.value]));

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
