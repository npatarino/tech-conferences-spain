#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DS_ROOT = path.resolve(ROOT, "node_modules/@chimichurricode/design-system");
const ICONS_DIR = path.resolve(DS_ROOT, "assets/icons");
const PUBLIC = path.resolve(ROOT, "public");
const ICON_FILES = ["favicon.svg","favicon-32x32.png","apple-touch-icon.png","mask-icon.svg","icon-192.png","icon-512.png"];
let count = 0;
for (const f of ICON_FILES) {
  const src = path.join(ICONS_DIR, f);
  const dest = path.join(PUBLIC, f);
  if (fs.existsSync(src)) { fs.copyFileSync(src, dest); count++; }
}
console.log(`✓ synced ${count} SEO assets → public/`);
