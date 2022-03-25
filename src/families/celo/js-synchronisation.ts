import { encodeAccountId } from "../../account";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";
import { getAccountDetails } from "./api";
import { getAccountRegistrationStatus } from "./api/sdk";
import { BigNumber } from "bignumber.js";

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
  } = await getAccountDetails(address, accountId);

  const accountRegistrationStatus = await getAccountRegistrationStatus(address);

  const operations = mergeOps(oldOperations, newOperations);
  const shape = {
    id: accountId,
    balance,
    spendableBalance,
    operationsCount: operations.length,
    blockHeight,
    celoResources: {
      registrationStatus: accountRegistrationStatus,
      lockedBalance: new BigNumber(5000000000000000),
      unlockedBalance: new BigNumber(6000000000000000),
      unlockingBalance: new BigNumber(7000000000000000),
    },
  };
  return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });
