// Prints the agent's reasoning for the demo scenario.
// Usage: node src/agent/demo.js [clear|confirmed]

import { PeckAgent } from './agent.js';
import { LOCATIONS, demoEvents } from './simulator.js';

const outcome = process.argv[2] === 'confirmed' ? 'confirmed' : 'clear';
const agent = new PeckAgent(LOCATIONS);
const stamp = (time) => time.slice(5, 16).replace('T', ' ');

for (const event of demoEvents(outcome)) {
  const start = agent.trace.length;
  agent.handle(event);
  if (event.label) console.log(`\n> ${stamp(event.time)}  ${event.label}`);
  if (event.quiet) continue;
  for (const { kind, text } of agent.trace.slice(start)) {
    console.log(`    ${kind.padEnd(11)} ${text}`);
  }
}

const { packages, intentions } = agent.getState();
console.log('\nFinal package status:');
for (const p of packages) console.log(`    ${p.id.padEnd(8)} ${p.status}`);
console.log(`Open intentions: ${intentions.map((i) => i.key).join(', ') || 'none'}`);
