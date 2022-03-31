import type { Account } from "../../types";
import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { getAccountDetails } from "./api";
import { getAccountRegistrationStatus, getPendingWithdrawals } from "./api/sdk";

const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency, initialAccount, derivationMode } = info;
  const oldOperations = initialAccount?.operations || [];

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  const {
    blockHeight,
    balance,
    spendableBalance,
    operations: newOperations,
    lockedBalance,
    nonvotingLockedBalance,
  } = await getAccountDetails(address, accountId);

  const accountRegistrationStatus = await getAccountRegistrationStatus(address);

  const pendingWithdrawals = await getPendingWithdrawals(address);

  const operations = mergeOps(oldOperations, newOperations);
  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    celoResources: {
      registrationStatus: accountRegistrationStatus,
      lockedBalance,
      nonvotingLockedBalance,
      pendingWithdrawals,
    },
  };
  return { ...shape, operations };
};

const postSync = (_initial: Account, parent: Account) => {
  return parent;
};

export const scanAccounts = makeScanAccounts(getAccountShape);
export const sync = makeSync(getAccountShape, postSync);
