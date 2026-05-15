import { build } from "esbuild";
import { rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const outfile = "tmp/simulation-smoke-bundle.mjs";

await build({
  entryPoints: ["tools/simulation_smoke_entry.ts"],
  bundle: true,
  outfile,
  platform: "node",
  format: "esm",
  logLevel: "silent",
  plugins: [
    {
      name: "asset-url-stub",
      setup(build) {
        build.onResolve({ filter: /\.(png|jpg|jpeg|gif|mp3|wav)\?url$/ }, (args) => ({
          path: args.path,
          namespace: "asset-url-stub",
        }));
        build.onLoad({ filter: /.*/, namespace: "asset-url-stub" }, (args) => ({
          contents: `export default ${JSON.stringify(args.path)};`,
          loader: "js",
        }));
      },
    },
  ],
});

try {
  await import(pathToFileURL(outfile).href);
} finally {
  await rm(outfile, { force: true });
}
