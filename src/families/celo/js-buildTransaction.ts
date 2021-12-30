import type { Transaction } from "./types";
import type { Account } from "../../types";
import { CeloTx } from "@celo/connect";
import { celoKit } from "./api/sdk";
import { BigNumber } from "bignumber.js";

//DRY, extract to constants
const FIGMENT_VALIDATOR_GROUP_ADDRESS =
  "0x01b2b83fDf26aFC3Ca7062C35Bc68c8DdE56dB04";

const buildTransaction = async (account: Account, transaction: Transaction) => {
  const kit = celoKit();
  const { amount } = transaction;
  const value = transaction.useAllAmount
    ? account.spendableBalance.minus(transaction.fees || 0)
    : amount;

  let celoTransaction: CeloTx;

  if (transaction.mode === "lock") {
    const lockedGold = await kit.contracts.getLockedGold();
    celoTransaction = {
      from: account.freshAddress,
      value: value.toFixed(),
      to: lockedGold.address,
      data: lockedGold.lock().txo.encodeABI(),
    };
  } else if (transaction.mode === "unlock") {
    const lockedGold = await kit.contracts.getLockedGold();
    celoTransaction = {
      from: account.freshAddress,
      to: lockedGold.address,
      data: lockedGold.unlock(value).txo.encodeABI(),
    };
  } else if (transaction.mode === "vote") {
    const election = await kit.contracts.getElection();
    const vote = await election.vote(
      FIGMENT_VALIDATOR_GROUP_ADDRESS,
      new BigNumber(value)
    );

    celoTransaction = {
      from: account.freshAddress,
      to: election.address,
      data: vote.txo.encodeABI(),
    };
  } else if (transaction.mode === "revoke") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();

    const voteSignerAccount = await accounts.voteSignerToAccount(
      account.freshAddress
    );

    const revoke = await election.revoke(
      voteSignerAccount,
      FIGMENT_VALIDATOR_GROUP_ADDRESS,
      new BigNumber(value)
    );

    //TODO: revoke returns an array because multiple votes can be casted to a validator group? UI?
    //are we fine revoking only first vote?
    celoTransaction = {
      from: account.freshAddress,
      to: election.address,
      data: revoke[0].txo.encodeABI(),
    };
  } else {
    const celoToken = await kit.contracts.getGoldToken();

    celoTransaction = {
      from: account.freshAddress,
      to: celoToken.address,
      data: celoToken
        .transfer(transaction.recipient, value.toFixed())
        .txo.encodeABI(),
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
