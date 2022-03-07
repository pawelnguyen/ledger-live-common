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
  } else if (transaction.mode === "withdraw") {
    const lockedGold = await kit.contracts.getLockedGold();
    const withdrawalIndex = 0;

    celoTransaction = {
      from: account.freshAddress,
      to: lockedGold.address,
      data: await lockedGold.withdraw(withdrawalIndex).txo.encodeABI(),
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

    const revokes = await election.revoke(
      voteSignerAccount,
      FIGMENT_VALIDATOR_GROUP_ADDRESS,
      new BigNumber(value)
    );
    const revoke = revokes.pop();
    if (!revoke) throw new Error("No votes to revoke");

    celoTransaction = {
      from: account.freshAddress,
      to: election.address,
      data: revoke.txo.encodeABI(),
    };
  } else if (transaction.mode === "activate") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();
    const voteSignerAccount = await accounts.voteSignerToAccount(
      account.freshAddress
    );

    const activates = await election.activate(voteSignerAccount);
    const activate = activates.pop();
    if (!activate) throw new Error("No votes to activate");

    celoTransaction = {
      from: account.freshAddress,
      to: election.address,
      data: activate.txo.encodeABI(),
    };
  } else if (transaction.mode === "register") {
    const accounts = await kit.contracts.getAccounts();

    celoTransaction = {
      from: account.freshAddress,
      to: accounts.address,
      data: accounts.createAccount().txo.encodeABI(),
    };
  } else {
    // Send
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
