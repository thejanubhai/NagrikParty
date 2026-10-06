// Emits one "path<TAB>integrity" line per lockfile package.
// (PowerShell 5.1 cannot parse the lockfile: its root key is "", an invalid
// property name, so Node does the JSON parsing. ".cjs" is required because
// package.json declares "type": "module".)
const fs = require('fs');
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
for (const [name, meta] of Object.entries(lock.packages || {})) {
  if (!name || !meta || !meta.integrity) continue;
  console.log(`${name}\t${meta.integrity}`);
}
