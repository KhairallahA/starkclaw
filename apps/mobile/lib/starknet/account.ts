import { Account, type SignerInterface } from "starknet";

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

type SessionSignerOptions =
  | {
      signer: SignerInterface;
      sessionPrivateKey?: never;
      sessionPublicKey?: never;
    }
  | {
      signer?: undefined;
      sessionPrivateKey: string;
      sessionPublicKey?: string;
    };

export function createSessionAccount(
  opts: {
    rpcUrl: string;
    accountAddress: string;
  } & SessionSignerOptions
): Account {
  const signer =
    opts.signer ?? new SessionKeySigner(opts.sessionPrivateKey, opts.sessionPublicKey);

  return new Account({
    provider: { nodeUrl: opts.rpcUrl },
    address: opts.accountAddress,
    signer,
  });
}
