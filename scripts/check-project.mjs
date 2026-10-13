import { existsSync, readFileSync } from "node:fs";

const required = [
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "PRIVACY.md",
  "wrangler.jsonc",
  "migrations/0001_initial.sql",
  "src/worker.ts",
  "public/index.html",
  "public/app.js",
  "public/styles.css"
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`Missing required project files: ${missing.join(", ")}`);
  process.exit(1);
}

const workerConfig = readFileSync("wrangler.jsonc", "utf8");
if (!workerConfig.includes('"binding": "DB"')) {
  console.error("wrangler.jsonc must bind DB.");
  process.exit(1);
}

console.log("Project structure and required Cloudflare bindings are present.");
