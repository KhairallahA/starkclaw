import * as Crypto from "expo-crypto";
import { ec, hash } from "starknet";

import { createOwnerAccount } from "../starknet/account";
import { callContract } from "../starknet/rpc";
import { u256FromBigInt } from "../starknet/u256";
import { secureDelete, secureGet, secureSet } from "../storage/secure-store";
import type { WalletSnapshot } from "../wallet/wallet";

const SESSION_KEYS_INDEX_ID = "starkclaw.session_keys.v1";

function sessionPkStorageKey(sessionPublicKey: string): string {
  return `starkclaw.session_pk.${sessionPublicKey}`;
}

function normalizePrivateKey(bytes: Uint8Array): string {
  const scalar = ec.starkCurve.utils.normPrivateKeyToScalar(bytes);
  return `0x${scalar.toString(16).padStart(64, "0")}`;
}

export type StoredSessionKey = {
  key: string; // session public key (felt)
  tokenSymbol: string;
  tokenAddress: string;
  spendingLimit: string; // decimal string in token base units
  validAfter: number; // unix seconds
  validUntil: number; // unix seconds
  allowedContract: string;
  createdAt: number; // unix seconds
  registeredAt?: number; // unix seconds
  revokedAt?: number; // unix seconds
  lastTxHash?: string;
};

function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

async function loadIndex(): Promise<StoredSessionKey[]> {
  const raw = await secureGet(SESSION_KEYS_INDEX_ID);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredSessionKey[];
  } catch {
    return [];
  }
}

async function saveIndex(list: StoredSessionKey[]): Promise<void> {
  await secureSet(SESSION_KEYS_INDEX_ID, JSON.stringify(list));
}

export async function listSessionKeys(): Promise<StoredSessionKey[]> {
  const list = await loadIndex();
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSessionPrivateKey(sessionPublicKey: string): Promise<string | null> {
  return secureGet(sessionPkStorageKey(sessionPublicKey));
}

export async function createLocalSessionKey(params: {
  tokenSymbol: string;
  tokenAddress: string;
  spendingLimit: bigint;
  validForSeconds: number;
  allowedContract: string;
}): Promise<StoredSessionKey> {
  const createdAt = nowSec();
  const bytes = await Crypto.getRandomBytesAsync(32);
  const pk = normalizePrivateKey(bytes);
  const pub = ec.starkCurve.getStarkKey(pk);

  const validAfter = createdAt - 5;
  const validUntil = createdAt + Math.max(60, params.validForSeconds);

  const item: StoredSessionKey = {
    key: pub,
    tokenSymbol: params.tokenSymbol,
    tokenAddress: params.tokenAddress,
    spendingLimit: params.spendingLimit.toString(),
    validAfter,
    validUntil,
    allowedContract: params.allowedContract,
    createdAt,
  };

  await secureSet(sessionPkStorageKey(pub), pk);

  const list = await loadIndex();
  list.push(item);
  await saveIndex(list);

  return item;
}

export async function deleteLocalSessionKeySecret(sessionPublicKey: string): Promise<void> {
  await secureDelete(sessionPkStorageKey(sessionPublicKey));
}

export async function registerSessionKeyOnchain(params: {
  wallet: WalletSnapshot;
  ownerPrivateKey: string;
  session: StoredSessionKey;
}): Promise<{ txHash: string }> {
  const spending = BigInt(params.session.spendingLimit);
  const { low, high } = u256FromBigInt(spending);

  const account = createOwnerAccount({
    rpcUrl: params.wallet.rpcUrl,
    accountAddress: params.wallet.accountAddress,
    ownerPrivateKey: params.ownerPrivateKey,
  });

  const tx = await account.execute({
    contractAddress: params.wallet.accountAddress,
    entrypoint: "register_session_key",
    calldata: [
      params.session.key,
      params.session.validAfter.toString(),
      params.session.validUntil.toString(),
      low,
      high,
      params.session.tokenAddress,
      params.session.allowedContract,
    ],
  });

  await account.waitForTransaction(tx.transaction_hash, { retries: 60, retryInterval: 3_000 });

  const list = await loadIndex();
  const i = list.findIndex((x) => x.key === params.session.key);
  if (i >= 0) {
    const updated: StoredSessionKey = {
      ...list[i],
      registeredAt: nowSec(),
      lastTxHash: tx.transaction_hash,
    };
    list[i] = updated;
    await saveIndex(list);
  }

  return { txHash: tx.transaction_hash };
}

export async function revokeSessionKeyOnchain(params: {
  wallet: WalletSnapshot;
  ownerPrivateKey: string;
  sessionPublicKey: string;
}): Promise<{ txHash: string }> {
  const account = createOwnerAccount({
    rpcUrl: params.wallet.rpcUrl,
    accountAddress: params.wallet.accountAddress,
    ownerPrivateKey: params.ownerPrivateKey,
  });

  const tx = await account.execute({
    contractAddress: params.wallet.accountAddress,
    entrypoint: "revoke_session_key",
    calldata: [params.sessionPublicKey],
  });

  await account.waitForTransaction(tx.transaction_hash, { retries: 60, retryInterval: 3_000 });

  const list = await loadIndex();
  const i = list.findIndex((x) => x.key === params.sessionPublicKey);
  if (i >= 0) {
    list[i] = { ...list[i], revokedAt: nowSec(), lastTxHash: tx.transaction_hash };
    await saveIndex(list);
  }

  await deleteLocalSessionKeySecret(params.sessionPublicKey);
  return { txHash: tx.transaction_hash };
}

export async function emergencyRevokeAllOnchain(params: {
  wallet: WalletSnapshot;
  ownerPrivateKey: string;
}): Promise<{ txHash: string }> {
  const account = createOwnerAccount({
    rpcUrl: params.wallet.rpcUrl,
    accountAddress: params.wallet.accountAddress,
    ownerPrivateKey: params.ownerPrivateKey,
  });

  const tx = await account.execute({
    contractAddress: params.wallet.accountAddress,
    entrypoint: "emergency_revoke_all",
    calldata: [],
  });

  await account.waitForTransaction(tx.transaction_hash, { retries: 60, retryInterval: 3_000 });

  const list = await loadIndex();
  const revokedAt = nowSec();
  const updated = list.map((x) => ({ ...x, revokedAt, lastTxHash: tx.transaction_hash }));
  await saveIndex(updated);

  for (const k of updated) {
    await deleteLocalSessionKeySecret(k.key);
  }

  return { txHash: tx.transaction_hash };
}

export async function isSessionKeyValidOnchain(params: {
  rpcUrl: string;
  accountAddress: string;
  sessionPublicKey: string;
}): Promise<boolean> {
  const selector = hash.getSelectorFromName("is_session_key_valid");
  const res = await callContract(params.rpcUrl, {
    contract_address: params.accountAddress,
    entry_point_selector: selector,
    calldata: [params.sessionPublicKey],
  });
  const v = res[0] ?? "0x0";
  return BigInt(v) !== 0n;
}

