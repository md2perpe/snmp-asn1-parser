const fs = require('fs');
const path = require('path');
const ohm = require('ohm-js');

const root = process.cwd();
const grammarPath = path.join(root, 'asn1.ohm');
const mibDir = path.join(root, 'mibs');

if (!fs.existsSync(grammarPath)) {
  console.error(`Missing grammar file: ${grammarPath}`);
  process.exit(2);
}

if (!fs.existsSync(mibDir)) {
  console.error(`Missing MIB directory: ${mibDir}`);
  process.exit(2);
}

const grammarSource = fs.readFileSync(grammarPath, 'utf8');
const grammar = ohm.grammar(grammarSource);

const files = fs
  .readdirSync(mibDir)
  .filter(file => file.toLowerCase().endsWith('.mib'))
  .sort();

let failed = 0;

for (const file of files) {
  const filePath = path.join(mibDir, file);
  const source = fs.readFileSync(filePath, 'utf8');
  const match = grammar.match(source, 'Start');

  if (match.succeeded()) {
    console.log(`PASS ${file}`);
    continue;
  }

  failed += 1;
  console.log(`FAIL ${file}`);
  console.log(match.message.split('\n').slice(0, 4).join('\n'));
}

console.log(`SUMMARY total=${files.length} passed=${files.length - failed} failed=${failed}`);

if (failed > 0) {
  process.exit(1);
}
