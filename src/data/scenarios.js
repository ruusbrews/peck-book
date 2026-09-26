// Single source of truth for the worker scan flow.
// This file intentionally has no dependency on anything under `src/agent/` and must remain
// standalone so the worker scan flow can be demoed independently from the admin/reasoning UI.
// In a real deployment, the verdict/action would come from actual color analysis and possibly
// a reasoning agent; this demo uses a lookup table keyed by barcode for a deterministic workflow.
export const SCENARIOS = {
  '50503694': {
    tier: 'good',
    batchId: 'BRZ-0472',
    product: 'Frozen Whole Chicken, 20kg case',
    supplier: 'Brazilian Poultry Exporter (Rio Grande do Sul)',
    ammoniaResult: 'pass',
    freezeThawResult: 'pass',
    verdict: 'pass',
    verdictLabel: 'No anomalies detected',
    action: 'continue',
    actionLabel: 'Continue — shipment cleared for next stage',
  },
  '60405891': {
    tier: 'moderate',
    batchId: 'BRZ-0389',
    product: 'Frozen Whole Chicken, 20kg case',
    supplier: 'Brazilian Poultry Exporter (Rio Grande do Sul)',
    ammoniaResult: 'pass',
    freezeThawResult: 'fail',
    verdict: 'caution',
    verdictLabel: 'Freeze-thaw event detected — spoilage not yet critical',
    action: 'continue_inspect',
    actionLabel: 'Continue with manual inspection at next checkpoint',
  },
  '70309813': {
    tier: 'bad',
    batchId: 'BRZ-0561',
    product: 'Frozen Whole Chicken, 20kg case',
    supplier: 'Brazilian Poultry Exporter (Rio Grande do Sul)',
    ammoniaResult: 'fail',
    freezeThawResult: 'fail',
    verdict: 'fail',
    verdictLabel: 'Spoilage and extended freeze-thaw both detected',
    action: 'stop',
    actionLabel: 'Stop — halt supply chain. An alert has been sent to the Ministry for inspection.',
  },
};

export const STAGES = ['Brazil / Supplier', 'Hamad Port', 'Wholesale / Storage', 'Shop / Retail'];
