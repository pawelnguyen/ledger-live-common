import invariant from "invariant";
import flatMap from "lodash/flatMap";

import type {
  Transaction,
  Account,
  AccountLike,
  AccountLikeArray,
} from "../../types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, lock, unlock, withdraw, vote, revoke, activate, register",
  },
];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "celo", "celo family");

  const accounts: Account[] = [account];
  return accounts;
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
    mainAccount: Account;
  }>,
  opts: Record<string, any>
): Transaction[] {
  const mode = opts.mode || "send";
  invariant(
    [
      "send",
      "lock",
      "unlock",
      "withdraw",
      "vote",
      "revoke",
      "activate",
      "register",
    ].includes(mode),
    `Unexpected mode: ${mode}`
  );

  return flatMap(transactions, ({ transaction }) => {
    invariant(transaction.family === "celo", "celo family");

    return {
      ...transaction,
      family: "celo",
      mode,
    } as Transaction;
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
