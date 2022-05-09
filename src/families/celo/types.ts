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
  votes: CeloVote[] | null | undefined;
};
export type CeloResourcesRaw = {
  registrationStatus: boolean;
  lockedBalance: string;
  nonvotingLockedBalance: string;
  pendingWithdrawals: CeloPendingWithdrawalRaw[] | null | undefined;
  votes: CeloVoteRaw[] | null | undefined;
};
export type Transaction = TransactionCommon & {
  family: "celo";
  fees: BigNumber | null | undefined;
  mode: CeloOperationMode;
  index: number | null | undefined;
};
export type TransactionRaw = TransactionCommonRaw & {
  family: "celo";
  fees: string | null | undefined;
  mode: CeloOperationMode;
  index: number | null | undefined;
};
export type CeloValidatorGroup = {
  address: string;
  name: string;
  votes: BigNumber;
};
export type CeloVote = {
  validatorGroup: string;
  pendingAmount: BigNumber;
  activeAmount: BigNumber;
  activatable: boolean;
};
export type CeloVoteRaw = {
  validatorGroup: string;
  pendingAmount: string;
  activeAmount: string;
  activatable: boolean;
};
export type CeloRevoke = {
  validatorGroup: string;
  index: number;
  amount: BigNumber;
  activeStatus: boolean;
};
export type CeloPreloadData = {
  validatorGroups: CeloValidatorGroup[];
};

export type CoreStatics = Record<string, never>;
export type CoreAccountSpecifics = Record<string, never>;
export type CoreOperationSpecifics = Record<string, never>;
export type CoreCurrencySpecifics = Record<string, never>;
export const reflect = (_declare: any) => {};
