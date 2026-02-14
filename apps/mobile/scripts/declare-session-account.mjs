#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { Account, RpcProvider, extractContractHashes } from "starknet";

const CLASS_HASH_REGEX = /^0x[0-9a-fA-F]{1,64}$/;
const DEFAULT_EXPECTED_SESSION_ACCOUNT_CLASS_HASH =
  "0x4c1adc7ae850ce40188692488816042114f055c32b61270f775c98163a69f77";

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function normalizeClassHash(name, value) {
  const trimmed = value.trim();
  if (!CLASS_HASH_REGEX.test(trimmed)) {
    throw new Error(`${name} must be a 0x-prefixed hex felt (1-64 hex chars)`);
  }
  return `0x${trimmed.slice(2).toLowerCase()}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");

const rpcUrl =
  process.env.STARKNET_RPC_URL ?? "https://starknet-sepolia-rpc.publicnode.com";
const deployerAddress = requiredEnv("STARKNET_DEPLOYER_ADDRESS");
const deployerPrivateKey = requiredEnv("STARKNET_DEPLOYER_PRIVATE_KEY");
const expectedClassHash = normalizeClassHash(
  "EXPECTED_SESSION_ACCOUNT_CLASS_HASH",
  process.env.EXPECTED_SESSION_ACCOUNT_CLASS_HASH
    ?? DEFAULT_EXPECTED_SESSION_ACCOUNT_CLASS_HASH
);

const pkgDir = process.env.UPSTREAM_SESSION_ACCOUNT_PATH
  ? path.resolve(process.env.UPSTREAM_SESSION_ACCOUNT_PATH)
  : path.join(repoRoot, "../starknet-agentic/contracts/session-account");
const targetDir = path.join(pkgDir, "target/dev");

const sierraPath = path.join(
  targetDir,
  "session_account_SessionAccount.contract_class.json"
);
const casmPath = path.join(
  targetDir,
  "session_account_SessionAccount.compiled_contract_class.json"
);

async function main() {
  console.log("RPC:", rpcUrl);
  console.log("Deployer:", deployerAddress);
  console.log("Session account source:", pkgDir);
  console.log("Building contracts...");
  execSync("scarb build", { cwd: pkgDir, stdio: "inherit" });

  console.log("Loading artifacts...");
  const sierra = JSON.parse(await readFile(sierraPath, "utf8"));
  const casm = JSON.parse(await readFile(casmPath, "utf8"));

  const hashes = extractContractHashes({ contract: sierra, casm });
  console.log("Computed classHash:", hashes.classHash);
  console.log("Computed compiledClassHash:", hashes.compiledClassHash);
  if (normalizeClassHash("computed classHash", hashes.classHash) !== expectedClassHash) {
    throw new Error(
      `Class hash mismatch: expected ${expectedClassHash}, got ${hashes.classHash}`
    );
  }

  const provider = new RpcProvider({ nodeUrl: rpcUrl });
  const account = new Account({
    provider,
    address: deployerAddress,
    signer: deployerPrivateKey,
  });

  console.log("Declaring (if not already declared)...");
  const resp = await account.declareIfNot({ contract: sierra, casm });

  if (!resp.transaction_hash) {
    console.log("Already declared. classHash:", resp.class_hash);
    return;
  }

  console.log("Declare tx:", resp.transaction_hash);
  await account.waitForTransaction(resp.transaction_hash, {
    retries: 120,
    retryInterval: 3_000,
  });
  console.log("Declared. classHash:", resp.class_hash);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
