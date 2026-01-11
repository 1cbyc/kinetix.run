import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs"],
  target: "node20",
  outDir: "dist",
  clean: true,
  shims: false,
  splitting: false,
  sourcemap: true,
  external: [],
  noExternal: ["commander", "chalk", "ora", "inquirer", "table", "conf", "open"],
});