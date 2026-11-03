import { defineWebApp } from "@chimichurricode/web-app-kit/config";
import { loadEnv } from "vite";

const env = loadEnv("", process.cwd(), "");
for (const key of Object.keys(env)) {
  if (process.env[key] === undefined) process.env[key] = env[key];
}

const config = defineWebApp({
  siteId: "techconf",
  preact: true,
});

// Astro 7 changed the `compressHTML` default to "jsx" (JSX whitespace rules),
// which drops the space between inline elements written on separate lines.
// Keep the HTML-aware compression the site was built with. Redundant once
// @chimichurricode/web-app-kit >= 0.2.0 (which defaults to it) is installed.
config.compressHTML = true;

export default config;
