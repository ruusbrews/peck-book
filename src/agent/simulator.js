// Demo scenario: one Brazilian shipment moving through Qatar's domestic chain.
// Two packages thaw after leaving Wholesale B, which makes the agent suspect the
// handler and hold stock from there, even stock whose strip still looks clean.

// Coordinates are illustrative points around Doha, used for the GPS cross-check.
export const LOCATIONS = [
  { id: 'hamad-port', name: 'Hamad Port', stage: 'port', coords: { lat: 25.012, lng: 51.605 } },
  { id: 'wholesale-a', name: 'Wholesale A', stage: 'wholesale', coords: { lat: 25.195, lng: 51.435 } },
  { id: 'wholesale-b', name: 'Wholesale B', stage: 'wholesale', coords: { lat: 25.168, lng: 51.598 } },
  { id: 'shop-1', name: 'Shop 1', stage: 'retail', coords: { lat: 25.286, lng: 51.531 } },
  { id: 'shop-2', name: 'Shop 2', stage: 'retail', coords: { lat: 25.318, lng: 51.438 } },
  { id: 'shop-3', name: 'Shop 3', stage: 'retail', coords: { lat: 25.252, lng: 51.497 } },
];

const CLEAN = { thaw: false, ph: 'fresh', readConfidence: 0.95 };
const at = (day, hour, minute = 0) =>
  `2026-10-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;

const scan = (packageId, location, time, strip = {}) => ({
  type: 'scan',
  packageId,
  location,
  time,
  ...CLEAN,
  ...strip,
});

// `warehouseBOutcome` is 'clear' or 'confirmed' and decides how the investigation ends.
// Events with `quiet` are routine and hidden in the printed demo; `label` narrates a step.
export function demoEvents(warehouseBOutcome = 'clear') {
  const ids = ['PKG-001', 'PKG-002', 'PKG-003', 'PKG-004', 'PKG-005', 'PKG-006'];

  const arrival = ids.flatMap((id) => [
    {
      type: 'register',
      packageId: id,
      batchId: 'BR-2841',
      expiry: id === 'PKG-005' ? '2026-10-06' : '2027-03-01',
      location: 'hamad-port',
      time: at(1, 8),
      quiet: true,
    },
    { ...scan(id, 'hamad-port', at(1, 9)), quiet: true },
  ]);
  arrival[0].label = 'Batch BR-2841 (6 packages) registered and scanned clean at Hamad Port';

  const toWholesale = ids.map((id, i) => ({
    ...scan(id, i < 4 ? 'wholesale-b' : 'wholesale-a', at(2, 10)),
    quiet: true,
  }));
  toWholesale[0].label = 'PKG-001..004 received by Wholesale B, PKG-005..006 by Wholesale A, all clean';

  const outcomeNote =
    warehouseBOutcome === 'clear'
      ? 'Freezer fault on 2 Oct was logged and repaired; no other stock affected'
      : 'Evidence of thawing and refreezing stock';

  return [
    ...arrival,
    ...toWholesale,
    {
      ...scan('PKG-001', 'shop-1', at(3, 9), { thaw: true }),
      label: 'PKG-001 reaches Shop 1 - thaw square has triggered',
    },
    {
      ...scan('PKG-002', 'shop-1', at(3, 11), { thaw: true, ph: 'borderline' }),
      label: 'PKG-002 reaches Shop 1 - also thawed, second incident traced to Wholesale B',
    },
    {
      ...scan('PKG-003', 'shop-2', at(4, 9)),
      label: 'PKG-003 reaches Shop 2 - its strip is clean',
    },
    {
      ...scan('PKG-005', 'shop-3', at(4, 10)),
      label: 'PKG-005 (same batch, via Wholesale A) reaches Shop 3 two days before expiry',
    },
    {
      ...scan('PKG-006', 'shop-3', at(4, 10, 30)),
      label: 'PKG-006 (same batch, via Wholesale A) reaches Shop 3',
    },
    {
      ...scan('PKG-X99', 'shop-1', at(4, 12)),
      label: 'Unknown package PKG-X99 scanned at Shop 1',
    },
    {
      type: 'inspection',
      location: 'wholesale-b',
      result: warehouseBOutcome,
      note: outcomeNote,
      time: at(5, 9),
      label: `Inspector visits Wholesale B - result: ${warehouseBOutcome}`,
    },
    {
      type: 'inspection',
      packageId: 'PKG-001',
      result: 'pass',
      time: at(5, 14),
      label: 'PKG-001 inspected - passes',
    },
    {
      type: 'inspection',
      packageId: 'PKG-002',
      result: 'fail',
      time: at(5, 14, 30),
      label: 'PKG-002 inspected - fails',
    },
  ];
}
