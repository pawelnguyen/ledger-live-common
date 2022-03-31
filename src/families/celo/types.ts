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

export type CeloPendingWithdrawal = {
  value: BigNumber;
  time: BigNumber;
  index: number;
};
export type CeloPendingWithdrawalRaw = {
  value: string;
  time: string;
  index: string;
};
export type CeloResources = {
  registrationStatus: boolean;
  lockedBalance: BigNumber;
  nonvotingLockedBalance: BigNumber;
  pendingWithdrawals: CeloPendingWithdrawal[] | null | undefined;
};
export type CeloResourcesRaw = {
  registrationStatus: boolean;
  lockedBalance: string;
  nonvotingLockedBalance: string;
  pendingWithdrawals: CeloPendingWithdrawalRaw[] | null | undefined;
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

export type CoreStatics = Record<string, never>;
export type CoreAccountSpecifics = Record<string, never>;
export type CoreOperationSpecifics = Record<string, never>;
export type CoreCurrencySpecifics = Record<string, never>;
export const reflect = (_declare: any) => {};
