import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";
import { celoKit } from "./api/sdk";

const getFeesForTransaction = async ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const { amount, index } = transaction;
  const kit = celoKit();

  // A workaround - estimating gas throws an error if value > funds
  let value;

  //TODO: needs refactoring? DRY with js-buildTransaction, pass an amount for minimum?
  if (
    (transaction.mode === "unlock" || transaction.mode === "vote") &&
    account.celoResources
  ) {
    value = transaction.useAllAmount
      ? account.celoResources.nonvotingLockedBalance
      : BigNumber.minimum(amount, account.celoResources.nonvotingLockedBalance);
  } else {
    value = transaction.useAllAmount
      ? account.spendableBalance
      : BigNumber.minimum(amount, account.spendableBalance);
  }

  let gas;
  if (transaction.mode === "lock") {
    const lockedGold = await kit.contracts.getLockedGold();

    gas = await lockedGold
      .lock()
      .txo.estimateGas({ from: account.freshAddress, value: value.toFixed() });
  } else if (transaction.mode === "unlock") {
    const lockedGold = await kit.contracts.getLockedGold();

    gas = await lockedGold
      .unlock(value)
      .txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "withdraw") {
    const lockedGold = await kit.contracts.getLockedGold();

    gas = await lockedGold
      .withdraw(index || 0)
      .txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "vote") {
    const election = await kit.contracts.getElection();

    const vote = await election.vote(
      transaction.recipient,
      new BigNumber(value)
    );

    gas = await vote.txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "revoke") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();
    const voteSignerAccount = await accounts.voteSignerToAccount(
      account.freshAddress
    );

    const revokes = await election.revoke(
      voteSignerAccount,
      transaction.recipient,
      new BigNumber(value)
    );

    console.log('transaction fees', transaction)

    // TODO: refactor, extract?
    const revoke = revokes.find((transactionObject) => {
      //TODO double check 'revokeActive'
      return (
        (transactionObject.txo as any)._method.name ===
        (transaction.index === 0 ? "revokePending" : "revokeActive")
      );
    });
    console.log('revoke fees', revoke);
    if (!revoke) return new BigNumber(0);

    gas = await revoke.txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "activate") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();
    const voteSignerAccount = await accounts.voteSignerToAccount(
      account.freshAddress
    );

    const activates = await election.activate(voteSignerAccount);

    const activate = activates.find(
      (a) => a.txo.arguments[0] === transaction.recipient
    );
    if (!activate) return new BigNumber(0);

    gas = await activate.txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "register") {
    const accounts = await kit.contracts.getAccounts();

    gas = await accounts
      .createAccount()
      .txo.estimateGas({ from: account.freshAddress });
  } else {
    //TODO: check sending
    const celoToken = await kit.contracts.getGoldToken();

    const celoTransaction = {
      from: account.freshAddress,
      to: celoToken.address,
      data: celoToken
        .transfer(transaction.recipient, value.toFixed())
        .txo.encodeABI(),
    };

    gas = await kit.connection.estimateGasWithInflationFactor(celoTransaction);
  }

  const gasPrice = new BigNumber(await kit.connection.gasPrice());
  return gasPrice.times(gas);
};

export default getFeesForTransaction;
