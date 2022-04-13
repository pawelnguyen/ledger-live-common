import { Account } from "../../types";
import { Transaction } from "./types";
import getFeesForTransaction from "./js-getFeesForTransaction";
import { isValidAddress } from "@celo/utils/lib/address";
import BigNumber from "bignumber.js";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

const prepareTransaction = async (
  account: Account,
  transaction: Transaction
) => {
  //TODO: refactor?
  if (
    (transaction.recipient && !isValidAddress(transaction.recipient)) ||
    (transaction.mode === "send" && !transaction.recipient)
  ) {
    return transaction;
  }

  if (
    transaction.mode === "vote" &&
    (!transaction.recipient ||
      (new BigNumber(transaction.amount).lte(new BigNumber(0)) &&
        !transaction.useAllAmount))
  ) {
    return transaction;
  }

  const fees = await getFeesForTransaction({ account, transaction });

  if (!sameFees(transaction.fees, fees)) {
    return { ...transaction, fees };
  }

  return transaction;
};

export default prepareTransaction;
