// tests/prompts/run-benchmarks.mjs
// Runs the current prompt pipeline against benchmark samples.
// Writes timestamped output markdown for human-eye diff across prompt versions.
//
// Usage:
//   node tests/prompts/run-benchmarks.mjs
//   Output: tests/prompts/benchmarks/runs/YYYY-MM-DD-HHMM.md
//
// NOTE: This script dynamically imports a TypeScript file (lib/core/decodeEngine.ts).
// Plain `node` will NOT resolve `.ts` natively. If the dynamic import below fails,
// install tsx as a dev dep:
//   npm install -D tsx
// then rename this file to `run-benchmarks.ts` and run via:
//   npx tsx tests/prompts/run-benchmarks.ts

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// We need to run inside the project so the Anthropic SDK / env vars work.
process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '../..'));

// Load env from .env.local (simple loader, no dotenv dep).
const envText = readFileSync('.env.local', 'utf8');
for (const line of envText.split('\n')) {
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const [k, ...v] = line.split('=');
  process.env[k.trim()] = v.join('=').trim();
}

// Import the engine using dynamic import so env is loaded first.
const { callDetectAndAskFirst, callClassifyAndCompose } = await import(
  '../../lib/core/decodeEngine.ts'
);

const samples = JSON.parse(
  readFileSync('tests/prompts/benchmarks/samples.json', 'utf8'),
);

const runsDir = 'tests/prompts/benchmarks/runs';
if (!existsSync(runsDir)) mkdirSync(runsDir, { recursive: true });

const now = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
const outPath = `${runsDir}/${now}.md`;

const lines = [`# Benchmark run · ${now}`, ''];
for (const s of samples) {
  console.log(`Running ${s.id}...`);
  try {
    const { state, question } = await callDetectAndAskFirst(s.dump);
    // For classification, fake a minimal conversation with just the dump + one reply.
    const convo = [
      { role: 'user', content: s.dump },
      { role: 'assistant', content: question },
      { role: 'user', content: '[benchmark: assume user gave a reasonable follow-up reply]' },
    ];
    const { worries, primary_action, headline } = await callClassifyAndCompose(
      state,
      convo,
    );

    lines.push(`## ${s.id} · ${s.label}`);
    lines.push('');
    lines.push('**Dump:** ' + s.dump);
    lines.push('');
    lines.push('- **state:** `' + state + '`');
    lines.push('- **question:** ' + question);
    lines.push('- **headline:** ' + headline);
    lines.push('- **primary_action:** ' + primary_action);
    lines.push('- **worries:**');
    for (const w of worries) {
      lines.push(`  - [${w.category}] ${w.content}`);
    }
    lines.push('');
  } catch (e) {
    lines.push(`## ${s.id} ❌`);
    lines.push('Error: ' + String(e));
    lines.push('');
  }
}

writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log('Wrote ' + outPath);
