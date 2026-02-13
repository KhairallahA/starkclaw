/* eslint-disable no-console */
const fs = require("node:fs");
const path = require("node:path");

const { EXPO_ROUTER_CTX_IGNORE } = require("expo-router/_ctx-shared");
const requireContext = require("expo-router/build/testing-library/require-context-ponyfill").default;
const { getTypedRoutesDeclarationFile } = require("expo-router/build/typed-routes/generate");

const projectRoot = process.cwd();
const appRoot = path.resolve(projectRoot, "app");
const outDir = path.resolve(projectRoot, ".expo/types");
const outFile = path.resolve(outDir, "router.d.ts");

fs.mkdirSync(outDir, { recursive: true });

const ctx = requireContext(appRoot, true, EXPO_ROUTER_CTX_IGNORE);
const file = getTypedRoutesDeclarationFile(ctx);
fs.writeFileSync(outFile, file);

console.log(`generated ${path.relative(projectRoot, outFile)}`);

