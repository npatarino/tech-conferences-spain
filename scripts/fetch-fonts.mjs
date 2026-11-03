#!/usr/bin/env node
// Vendored from @chimichurricode/design-system scripts/fetch-fonts.mjs (0.8.1).
// Replace it with the package's `chimi-fetch-fonts` bin or its
// `@chimichurricode/design-system/fetch-fonts` export after upgrading the
// design system to >= 0.8.1, then delete this file.
/**
 * Put the brand font files into a site's tree (default `public/fonts`).
 *
 * Why this exists:
 *   The typefaces (CHANEY, At Aero, Scilla Narrow, Thunder, Nudica Mono) are
 *   licensed, so they can't ship in this public package or live in a public
 *   repo. They live in the private repo `npatarino/cv-fonts` (`fonts/`), and
 *   each site pulls them at build time with a read-only token.
 *
 * Where the files come from (first match wins):
 *   1. CHIMI_FONTS_DIR    A local directory (e.g. a clone: `…/cv-fonts/fonts`).
 *   2. CHIMI_FONTS_TOKEN  Fine-grained GitHub token, Contents: read-only on
 *                         npatarino/cv-fonts. Downloads the repo tarball at
 *                         CHIMI_FONTS_REF (default `main`) and extracts
 *                         `fonts/*`. Cached in node_modules/.cache/chimi-fonts
 *                         (per ref; a branch is refreshed after
 *                         CHIMI_FONTS_CACHE_HOURS, default 24; a commit SHA
 *                         is kept forever).
 *   3. Legacy: `assets/fonts` of an installed @chimichurricode/design-system
 *      ≤ 0.8.0, which still bundled the fonts.
 *   4. Nothing: prints how to set the token and exits 0, so the build still
 *      succeeds with system fonts. With `--require` or CHIMI_FONTS_REQUIRED=1
 *      it exits 1 instead.
 *
 *   Files that are already identical in the target are not rewritten. The
 *   token is never printed.
 *
 * Usage:
 *   chimi-fetch-fonts [target-dir] [--require]
 *   node node_modules/@chimichurricode/design-system/scripts/fetch-fonts.mjs public/fonts
 *
 *   import { fetchFonts } from "@chimichurricode/design-system/fetch-fonts";
 *   await fetchFonts({ outDir: "public/fonts" });
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { gunzipSync } from "node:zlib";
import { fileURLToPath, pathToFileURL } from "node:url";

export const FONTS_REPO = "npatarino/cv-fonts";
export const FONT_EXTENSIONS = new Set([".otf", ".ttf", ".woff", ".woff2"]);
const PKG = "@chimichurricode/design-system";
const TAG = "chimi-fetch-fonts";

const isFontFile = (name) => FONT_EXTENSIONS.has(path.extname(name).toLowerCase());

// ---------------------------------------------------------------- tar reader

function readString(buf, start, length) {
  const slice = buf.subarray(start, start + length);
  const end = slice.indexOf(0);
  return slice.subarray(0, end === -1 ? slice.length : end).toString("utf8");
}

function readSize(buf, start, length) {
  // GNU base-256 encoding for large sizes (high bit set).
  if (buf[start] & 0x80) {
    let n = 0;
    for (let i = start + 1; i < start + length; i++) n = n * 256 + buf[i];
    return n;
  }
  const text = readString(buf, start, length).trim();
  return text ? parseInt(text, 8) : 0;
}

function parsePax(data) {
  const out = {};
  let off = 0;
  while (off < data.length) {
    const space = data.indexOf(0x20, off);
    if (space === -1) break;
    const len = parseInt(data.subarray(off, space).toString("utf8"), 10);
    if (!len) break;
    const record = data.subarray(space + 1, off + len - 1).toString("utf8");
    const eq = record.indexOf("=");
    if (eq !== -1) out[record.slice(0, eq)] = record.slice(eq + 1);
    off += len;
  }
  return out;
}

/** Regular files of an uncompressed tar archive: [{ path, data }]. */
export function readTar(buf) {
  const files = [];
  let off = 0;
  let nextPath = null;
  while (off + 512 <= buf.length) {
    const header = buf.subarray(off, off + 512);
    if (header.every((b) => b === 0)) break;
    const name = readString(header, 0, 100);
    const size = readSize(header, 124, 12);
    const type = header[156] === 0 ? "0" : String.fromCharCode(header[156]);
    const prefix = readString(header, 257, 6).startsWith("ustar") ? readString(header, 345, 155) : "";
    const data = buf.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;

    if (type === "x") {
      nextPath = parsePax(data).path ?? null;
      continue;
    }
    if (type === "L") {
      nextPath = readString(data, 0, data.length);
      continue;
    }
    if (type === "g") continue;
    const filePath = nextPath ?? (prefix ? `${prefix}/${name}` : name);
    nextPath = null;
    if (type === "0" || type === "7") files.push({ path: filePath, data });
  }
  return files;
}

/**
 * Font files under `fonts/` in a GitHub repo tarball (gzipped), whose entries
 * look like `<owner>-<repo>-<sha>/fonts/<file>`. Only direct children of
 * `fonts/` with a font extension are returned: [{ name, data }].
 */
export function extractFontsFromTarball(gz) {
  const fonts = [];
  for (const entry of readTar(gunzipSync(gz))) {
    const parts = entry.path.split("/").filter(Boolean);
    if (parts.length !== 3 || parts[1] !== "fonts") continue;
    const name = parts[2];
    if (name.startsWith(".") || !isFontFile(name)) continue;
    fonts.push({ name, data: entry.data });
  }
  return fonts;
}

// ------------------------------------------------------------------- copying

function listFonts(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && isFontFile(e.name))
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

/** Write `data` to `dest` unless the file is already identical. */
function writeIfChanged(dest, data) {
  try {
    const st = fs.statSync(dest);
    if (st.size === data.length && fs.readFileSync(dest).equals(data)) return false;
  } catch {
    /* missing: write it */
  }
  fs.writeFileSync(dest, data);
  return true;
}

function copyFonts(fromDir, names, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  let written = 0;
  for (const name of names) {
    if (writeIfChanged(path.join(outDir, name), fs.readFileSync(path.join(fromDir, name)))) written++;
  }
  return written;
}

// ------------------------------------------------------------------- sources

function legacyFontsDir(cwd) {
  const candidates = [];
  try {
    const require = createRequire(path.join(cwd, "noop.js"));
    candidates.push(path.join(path.dirname(require.resolve(`${PKG}/package.json`)), "assets", "fonts"));
  } catch {
    /* not installed or no package.json export */
  }
  candidates.push(path.join(cwd, "node_modules", PKG, "assets", "fonts"));
  return candidates.find((dir) => listFonts(dir).length > 0) ?? null;
}

const isCommitSha = (ref) => /^[0-9a-f]{40}$/i.test(ref);

async function downloadToCache({ token, ref, cacheDir, maxAgeHours, fetchImpl, log }) {
  const stampFile = path.join(cacheDir, ".fetched-at");
  try {
    const age = (Date.now() - Number(fs.readFileSync(stampFile, "utf8"))) / 3_600_000;
    if (listFonts(cacheDir).length > 0 && (isCommitSha(ref) || age < maxAgeHours)) {
      return { dir: cacheDir, cached: true };
    }
  } catch {
    /* no cache yet */
  }

  const url = `https://api.github.com/repos/${FONTS_REPO}/tarball/${encodeURIComponent(ref)}`;
  const res = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": TAG,
    },
    redirect: "follow",
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const hint =
      res.status === 401
        ? "the token is invalid or expired"
        : res.status === 403 || res.status === 404
          ? `the token can't read ${FONTS_REPO} (or ref "${ref}" doesn't exist)`
          : res.statusText;
    throw new Error(`GitHub answered HTTP ${res.status}: ${hint}`);
  }
  const fonts = extractFontsFromTarball(Buffer.from(await res.arrayBuffer()));
  if (fonts.length === 0) throw new Error(`no font files under fonts/ in ${FONTS_REPO}@${ref}`);

  fs.rmSync(cacheDir, { recursive: true, force: true });
  fs.mkdirSync(cacheDir, { recursive: true });
  for (const { name, data } of fonts) fs.writeFileSync(path.join(cacheDir, name), data);
  fs.writeFileSync(stampFile, String(Date.now()));
  log(`${TAG}: downloaded ${fonts.length} fonts from ${FONTS_REPO}@${ref}`);
  return { dir: cacheDir, cached: false };
}

const MISSING_HELP = [
  `  Set CHIMI_FONTS_TOKEN in the build environment (Vercel project, CI secret): a`,
  `  fine-grained GitHub token with Contents: read-only access to ${FONTS_REPO}.`,
  `  For local dev you can instead point CHIMI_FONTS_DIR at a clone: CHIMI_FONTS_DIR=…/cv-fonts/fonts`,
].join("\n");

/**
 * Populate `outDir` with the brand fonts. Never throws for a missing source
 * unless `require` is set; returns what happened.
 *
 * @param {object} [options]
 * @param {string} [options.outDir="public/fonts"]  Relative to `cwd`.
 * @param {string} [options.cwd=process.cwd()]
 * @param {Record<string,string|undefined>} [options.env=process.env]
 * @param {boolean} [options.require]  Fail when no source is available (also CHIMI_FONTS_REQUIRED=1).
 * @param {typeof fetch} [options.fetch]
 * @param {(msg: string) => void} [options.log]
 * @param {(msg: string) => void} [options.warn]
 * @returns {Promise<{ source: "dir" | "github" | "legacy" | "none", from?: string, total: number, written: number, outDir: string }>}
 */
export async function fetchFonts(options = {}) {
  const env = options.env ?? process.env;
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const outDir = path.resolve(cwd, options.outDir ?? "public/fonts");
  const outLabel = path.relative(cwd, outDir) || ".";
  const log = options.log ?? ((m) => console.log(m));
  const warn = options.warn ?? ((m) => console.warn(m));
  const fetchImpl = options.fetch ?? globalThis.fetch;
  const required = Boolean(options.require) || env.CHIMI_FONTS_REQUIRED === "1" || env.CHIMI_FONTS_REQUIRED === "true";

  const done = (source, from, dir) => {
    const names = listFonts(dir);
    const written = copyFonts(dir, names, outDir);
    log(`✓ fonts → ${outLabel}: ${names.length} from ${from} (${written} written)`);
    return { source, from, total: names.length, written, outDir };
  };

  // 1. Local directory.
  if (env.CHIMI_FONTS_DIR) {
    const dir = path.resolve(cwd, env.CHIMI_FONTS_DIR);
    if (listFonts(dir).length > 0) return done("dir", `CHIMI_FONTS_DIR (${dir})`, dir);
    warn(`⚠ ${TAG}: CHIMI_FONTS_DIR=${dir} has no font files; trying the next source.`);
  }

  // 2. Private repo via token.
  const token = env.CHIMI_FONTS_TOKEN?.trim();
  if (token) {
    const ref = env.CHIMI_FONTS_REF?.trim() || "main";
    const cacheDir = path.join(cwd, "node_modules", ".cache", "chimi-fonts", ref.replace(/[^\w.-]/g, "_"));
    const maxAgeHours = Number(env.CHIMI_FONTS_CACHE_HOURS ?? 24);
    try {
      const { dir, cached } = await downloadToCache({ token, ref, cacheDir, maxAgeHours, fetchImpl, log });
      return done("github", `${FONTS_REPO}@${ref}${cached ? " (cached)" : ""}`, dir);
    } catch (err) {
      const message = String(err?.message ?? err).replaceAll(token, "***");
      warn(`⚠ ${TAG}: couldn't download the fonts from ${FONTS_REPO}: ${message}`);
    }
  }

  // 3. Legacy: an installed design system that still bundles the fonts.
  const legacy = legacyFontsDir(cwd);
  if (legacy) {
    if (!token) {
      warn(`⚠ ${TAG}: using the fonts bundled in an old ${PKG} (≤ 0.8.0). Newer versions don't ship them.\n${MISSING_HELP}`);
    }
    return done("legacy", `${PKG}/assets/fonts`, legacy);
  }

  // 4. Nothing.
  const msg = `${TAG}: no font source available, ${outLabel} was not populated (the site falls back to system fonts).\n${MISSING_HELP}`;
  if (required) {
    const err = new Error(msg);
    err.code = "CHIMI_FONTS_MISSING";
    throw err;
  }
  warn(`⚠ ${msg}`);
  return { source: "none", total: 0, written: 0, outDir };
}

// ----------------------------------------------------------------------- CLI

function isMain() {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}

if (isMain()) {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
    process.exit(0);
  }
  const outDir = args.find((a) => !a.startsWith("-")) ?? "public/fonts";
  try {
    await fetchFonts({ outDir, require: args.includes("--require") });
  } catch (err) {
    console.error(`✗ ${err.message}`);
    process.exit(1);
  }
}
