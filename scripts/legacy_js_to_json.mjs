// One-off: read the four browser data files exactly as a browser would and write them to data/*.json.
// Run from the repository root: node scripts/legacy_js_to_json.mjs
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const FILES = {
  "ecosystem-data.js": ["ECOSYSTEM", "data/ecosystem.json"],
  "size-data.js": ["ECO_SIZE", "data/size.json"],
  "field-data.js": ["FIELD", "data/field.json"],
  "control-data.js": ["CONTROL", "data/control.json"],
};

fs.mkdirSync("data", { recursive: true });
for (const [src, [name, out]] of Object.entries(FILES)) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(src, "utf8"), ctx, { filename: src });
  const value = ctx.window[name];
  assert.ok(value, `${src} did not set window.${name}`);
  const text = JSON.stringify(value, null, 1) + "\n";
  assert.deepEqual(JSON.parse(text), JSON.parse(JSON.stringify(value)), `${src} does not survive JSON`);
  fs.writeFileSync(out, text);
  console.log(`${src} -> ${out} (${text.length} bytes)`);
}
