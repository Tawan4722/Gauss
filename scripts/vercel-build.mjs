import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const env = {
  ...process.env,
  VERCEL_PREVIEW_COMMENTS_ENABLED: "0",
  VERCEL_PREVIEW_COMMENTS_OPT_IN: "0",
};

const result = spawnSync(process.execPath, [nextBin, "build"], {
  env,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
