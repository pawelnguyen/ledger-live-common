import type { Transaction } from "./types";
import type { Account } from "../../types";
import { CeloTx } from "@celo/connect";
import { celoKit } from "./api/sdk";

const buildTransaction = async (account: Account, transaction: Transaction) => {
  const kit = celoKit();
  const { amount } = transaction;
  const value = transaction.useAllAmount
    ? account.spendableBalance.minus(transaction.fees || 0)
    : amount;

  let celoTransaction: CeloTx;
  if (transaction.mode === "send") {
    const celoToken = await kit.contracts.getGoldToken();

    celoTransaction = {
      from: account.freshAddress,
      to: celoToken.address,
      data: celoToken
        .transfer(transaction.recipient, value.toFixed())
        .txo.encodeABI(),
    };
  } else {
    const lockedGold = await kit.contracts.getLockedGold();
    celoTransaction = {
      from: account.freshAddress,
      value: value.toFixed(),
      to: await lockedGold.address,
      data: await lockedGold.lock().txo.encodeABI(),
    };
  }

  return {
    ...celoTransaction,
    chainId: await kit.connection.chainId(),
    nonce: await kit.connection.nonce(account.freshAddress),
    gas: await kit.connection.estimateGasWithInflationFactor(celoTransaction),
    gasPrice: await kit.connection.gasPrice(),
  } as CeloTx;
};

export default buildTransaction;
