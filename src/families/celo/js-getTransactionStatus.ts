import { Account, TransactionStatus } from "../../types";
import { Transaction } from "./types";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { BigNumber } from "bignumber.js";
import { isValidAddress } from "@celo/utils/lib/address";
import { CeloAllFundsWarning } from "./errors";

// Arbitrary buffer for paying fees of next transactions. 0.05 Celo for ~100 transactions
const FEES_SAFETY_BUFFER = new BigNumber(5000000000000000);

const getTransactionStatus = async (
  account: Account,
  transaction: Transaction
): Promise<TransactionStatus> => {
  const errors: any = {};
  const warnings: any = {};
  const useAllAmount = !!transaction.useAllAmount;

  if (account.freshAddress === transaction.recipient) {
    errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource();
  }

  if (!transaction.fees || !transaction.fees.gt(0)) {
    errors.fees = new FeeNotLoaded();
  }

  const estimatedFees = transaction.fees || new BigNumber(0);

  let amount;
  if (useAllAmount) {
    amount = account.spendableBalance.minus(estimatedFees);
    if (transaction.mode === "lock") amount = amount.minus(FEES_SAFETY_BUFFER);
  } else {
    amount = new BigNumber(transaction.amount);
  }

  if (amount.lt(0)) amount = new BigNumber(0);

  if (
    transaction.mode == "lock" &&
    amount.gte(account.spendableBalance.minus(FEES_SAFETY_BUFFER))
  ) {
    warnings.amount = new CeloAllFundsWarning();
  }

  //TODO: also activate, withdraw?
  if (transaction.mode != "register") {
    if (amount.lte(0) && !useAllAmount) {
      errors.amount = new AmountRequired();
    }
  }

  const totalSpent = amount.plus(estimatedFees);

  if (totalSpent.gt(account.spendableBalance)) {
    errors.amount = new NotEnoughBalance();
  }

  if (!errors.amount && account.spendableBalance.lt(estimatedFees)) {
    errors.amount = new NotEnoughBalance();
  }

  if (transaction.mode === "send") {
    if (!transaction.recipient) {
      errors.recipient = new RecipientRequired();
    } else if (!isValidAddress(transaction.recipient)) {
      errors.recipient = new InvalidAddress("", {
        currencyName: account.currency.name,
      });
    }
  }

  return Promise.resolve({
    errors,
    warnings,
    estimatedFees,
    amount,
    totalSpent,
  });
};

export default getTransactionStatus;
