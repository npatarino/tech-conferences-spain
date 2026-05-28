import { defineWebApp } from "@chimichurricode/web-app-kit/config";
import { loadEnv } from "vite";

const env = loadEnv("", process.cwd(), "");
for (const key of Object.keys(env)) {
  if (process.env[key] === undefined) process.env[key] = env[key];
}

export default defineWebApp({
  siteId: "techconf",
  preact: true,
});
