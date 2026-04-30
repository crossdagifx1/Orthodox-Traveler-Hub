import * as esbuild from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";
import { createRequire } from "node:module";

// Ensure require is available for plugins
globalThis.require = createRequire(import.meta.url);

async function bundle() {
  console.log("Bundling API for Vercel...");
  try {
    await esbuild.build({
      entryPoints: ["scripts/api-entry.ts"],
      bundle: true,
      platform: "node",
      target: "node22",
      outdir: "api",
      format: "esm",
      outExtension: { ".js": ".mjs" },
      external: [],
      plugins: [esbuildPluginPino({ transports: ["pino-pretty"] })],
      sourcemap: true,
      minify: false,
      banner: {
        js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`,
      },
    });
    console.log("Bundle complete: api/index.js");
  } catch (err) {
    console.error("Bundle failed:", err);
    process.exit(1);
  }
}

bundle();
