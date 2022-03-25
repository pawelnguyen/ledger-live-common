import { BigNumber } from "bignumber.js";
import type {
  TransactionCommon,
  TransactionCommonRaw,
} from "../../types/transaction";

export type CeloOperationMode =
  | "send"
  | "lock"
  | "unlock"
  | "withdraw"
  | "vote"
  | "revoke"
  | "activate"
  | "register";
export type CeloResources = {
  registrationStatus: boolean;
  lockedBalance: BigNumber;
  unlockedBalance: BigNumber;
  unlockingBalance: BigNumber;
};
export type CeloResourcesRaw = {
  registrationStatus: boolean;
  lockedBalance: string;
  unlockedBalance: string;
  unlockingBalance: string;
};
export type Transaction = TransactionCommon & {
  family: "celo";
  fees: BigNumber | null | undefined;
  mode: CeloOperationMode;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "celo";
  fees: string | null | undefined;
  mode: CeloOperationMode;
};
