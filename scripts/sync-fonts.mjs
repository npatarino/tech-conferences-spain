#!/usr/bin/env node
// Copies the licensed brand fonts into public/fonts/ (git-ignored). They live in the
// private repo npatarino/cv-fonts; see "Fonts" in README.md for
// CHIMI_FONTS_TOKEN / CHIMI_FONTS_DIR. Pass --require to fail without them.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchFonts } from "./fetch-fonts.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  await fetchFonts({ cwd: ROOT, outDir: "public/fonts", require: process.argv.includes("--require") });
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}
