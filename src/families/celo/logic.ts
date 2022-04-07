import { Account } from "../../types";
import { CeloPendingWithdrawal } from "./types";

export const PRELOAD_MAX_AGE = 10 * 60 * 1000;

export const availablePendingWithdrawals = (
  account: Account
): CeloPendingWithdrawal[] => {
  const { pendingWithdrawals } = account.celoResources || {};

  return (pendingWithdrawals || []).filter(
    (withdrawal) => new Date(withdrawal.time.toNumber() * 1000) < new Date()
  );
};
