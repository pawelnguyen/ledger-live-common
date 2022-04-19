import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";
import { celoKit, getPendingVotes, getVotes } from "./api/sdk";

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

  //TODO: needs refactoring?
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

    console.log('revokes', revokes)

    //TODO: revoke returns an array with revokes for each validator group voted. find revokes for Figment validator group
    const revoke = revokes.pop();
    if (!revoke) return new BigNumber(0);

    console.log(revoke)

    gas = await revoke.txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.mode === "activate") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();
    const voteSignerAccount = await accounts.voteSignerToAccount(
      account.freshAddress
    );

    const activates = await election.activate(voteSignerAccount);

    //TODO: use to fetch amount and display in UI
    const votes = await getVotes(account.freshAddress)

    // console.log('getVotes', votes)
    // console.log('getVotes', votes, votes[1].pending)
    // console.log('activates', activates)

    // TODO: find activates via recipient, filter by txo.arguments[0]
    const activate = activates[0];
    console.log('activate', activate)
    if (!activate) return new BigNumber(0); //throw error instead? or should be thrown in diff place?


    const pendingVotes = await getPendingVotes(account.freshAddress)
    console.log('pendingVotes', pendingVotes)

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
