#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(ROOT, "node_modules/@chimichurricode/design-system/assets/fonts");
const DEST = path.resolve(ROOT, "public/fonts");
fs.mkdirSync(DEST, { recursive: true });
let count = 0;
for (const entry of fs.readdirSync(SRC, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  fs.copyFileSync(path.join(SRC, entry.name), path.join(DEST, entry.name));
  count++;
}
console.log(`✓ synced ${count} fonts → public/fonts`);
