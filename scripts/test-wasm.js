const fs = require('fs');
const path = require('path');
const { Parser, Language } = require('web-tree-sitter');

async function main() {
  const repoRoot = path.resolve(__dirname, '..');
  const wasmPath = path.join(repoRoot, 'tree-sitter-asn1.wasm');
  const inputPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.join(repoRoot, 'mibs', 'DCP-OPS-MIB.mib');

  if (!fs.existsSync(wasmPath)) {
    console.error(`Missing WASM grammar: ${wasmPath}`);
    process.exit(2);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Missing input file: ${inputPath}`);
    process.exit(2);
  }

  await Parser.init();

  const language = await Language.load(wasmPath);
  const parser = new Parser();
  parser.setLanguage(language);

  const source = fs.readFileSync(inputPath, 'utf8');
  const tree = parser.parse(source);
  const root = tree.rootNode;

  if (root.hasError) {
    console.error(`Parse failed: ${path.relative(repoRoot, inputPath)}`);
    console.error(root.toString());
    process.exit(1);
  }

  console.log(`Parse OK: ${path.relative(repoRoot, inputPath)}`);
  console.log(`Root: ${root.type}, children=${root.childCount}`);
}

main().catch(err => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
