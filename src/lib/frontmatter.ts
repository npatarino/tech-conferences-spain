/** Minimal YAML frontmatter parser tailored to the conference markdowns. */
export function parseFrontmatter(raw: string): { fm: Record<string, unknown>; body: string } {
  const stripped = raw.replace(/^\uFEFF/, "").trimStart();
  if (!stripped.startsWith("---")) return { fm: {}, body: raw };
  const end = stripped.indexOf("\n---", 3);
  if (end === -1) return { fm: {}, body: raw };
  const block = stripped.slice(4, end);
  const body = stripped.slice(end + 4).replace(/^\n/, "");

  const fm: Record<string, unknown> = {};
  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\s+#.*$/, "");
    const kv = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const value = kv[2].trim().replace(/^['"]|['"]$/g, "");
    if (value === "") {
      fm[key] = "";
    } else if (value === "true") {
      fm[key] = true;
    } else if (value === "false") {
      fm[key] = false;
    } else {
      fm[key] = value;
    }
  }
  return { fm, body };
}
