import { spawnSync } from "node:child_process";

import { requirePublicSiteUrl } from "../src/lib/seo/site-url.ts";

const [mode, target] = process.argv.slice(2);
if (!(
  ["technical", "public"].includes(mode) &&
  ["build", "validate"].includes(target)
)) {
  console.error("Uso: run-site-command.ts <technical|public> <build|validate>");
  process.exit(2);
}

const environment = { ...process.env };
try {
  if (mode === "technical") {
    environment.SITE_URL = "https://preview.gustavo-palhares.test";
  } else {
    requirePublicSiteUrl(environment.SITE_URL);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error("Não foi possível localizar o executável do npm.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [npmCli, "run", target], {
  cwd: process.cwd(),
  env: environment,
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);
