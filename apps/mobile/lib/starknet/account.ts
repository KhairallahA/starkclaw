import { Account } from "starknet";

import { SessionKeySigner } from "./session-signer";

export function createOwnerAccount(opts: {
  rpcUrl: string;
  accountAddress: string;
  ownerPrivateKey: string;
}): Account {
  return new Account({
    provider: { nodeUrl: opts.rpcUrl },
    address: opts.accountAddress,
    signer: opts.ownerPrivateKey,
  });
}

export function createSessionAccount(opts: {
  rpcUrl: string;
  accountAddress: string;
  sessionPrivateKey: string;
  sessionPublicKey?: string;
}): Account {
  return new Account({
    provider: { nodeUrl: opts.rpcUrl },
    address: opts.accountAddress,
    signer: new SessionKeySigner(opts.sessionPrivateKey, opts.sessionPublicKey),
  });
}

