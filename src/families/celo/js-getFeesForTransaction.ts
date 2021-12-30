import { BigNumber } from "bignumber.js";
import { Account, Transaction } from "../../types";
import { celoKit } from "./api/sdk";

const FIGMENT_VALIDATOR_GROUP_ADDRESS =
  "0x01b2b83fDf26aFC3Ca7062C35Bc68c8DdE56dB04";

const getFeesForTransaction = async ({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<BigNumber> => {
  const { amount } = transaction;
  const kit = celoKit();

  // A workaround - estimating gas throws an error if value > funds
  const value = transaction.useAllAmount
    ? account.spendableBalance
    : BigNumber.minimum(amount, account.spendableBalance);

  let gas;
  if (transaction.family === "celo" && transaction.mode === "lock") {
    const lockedGold = await kit.contracts.getLockedGold();

    // TODO: handle relock - pending withdrawals of locked Celo?
    // const pendingWithdrawalsValue = await lockedGold.getPendingWithdrawalsTotalValue(address)
    // const relockValue = BigNumber.minimum(pendingWithdrawalsValue, value)
    // const lockValue = value.minus(relockValue)

    //TODO: estimateGasWithInflationFactor instead?
    // TODO: min amount?
    //https://github.com/celo-tools/celo-web-wallet/blob/9ae0dbea6606644a8188da414602d4fbffc3967d/src/consts.ts#L34

    gas = await lockedGold
      .lock()
      .txo.estimateGas({ from: account.freshAddress, value: value.toFixed() });
  } else if (transaction.family === "celo" && transaction.mode === "unlock") {
    const lockedGold = await kit.contracts.getLockedGold();

    gas = await lockedGold
      .unlock(value)
      .txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.family === "celo" && transaction.mode === "withdraw") {
    const lockedGold = await kit.contracts.getLockedGold();

    //https://github.com/celo-org/celo-monorepo/blob/master/packages/cli/src/commands/lockedgold/withdraw.ts#L31
    const pendingWithdrawals = await lockedGold.getPendingWithdrawals(account.freshAddress);
    console.log('pendingWithdrawals', pendingWithdrawals,pendingWithdrawals[0].time)


    //TODO: handle index of pending withdrawal
    const withdrawalIndex = 0;
    //TODO: test and add to buildTransaction after withdrawal isn't pending anymore
    gas = await lockedGold
      .withdraw(withdrawalIndex)
      .txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.family === "celo" && transaction.mode === "vote") {
    const election = await kit.contracts.getElection();

    const vote = await election.vote(
      FIGMENT_VALIDATOR_GROUP_ADDRESS,
      new BigNumber(value)
    );
    gas = await vote.txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.family === "celo" && transaction.mode === "revoke") {
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

    console.log('revokes', revokes)

    //TODO: revoke returns an array with revokes for each validator group voted. find revokes for Figment validator group
    const revoke = revokes.pop();
    if (!revoke) return new BigNumber(0);

    console.log(revoke)

    gas = await revoke.txo.estimateGas({ from: account.freshAddress });
  } else if (transaction.family === "celo" && transaction.mode === "activate") {
    const election = await kit.contracts.getElection();
    const accounts = await kit.contracts.getAccounts();
    const voteSignerAccount = await accounts.voteSignerToAccount(
      account.freshAddress
    );

    //TODO: check if has pending votes -> in getTransactionStatus?
    const hasPendingVotes = await election.hasPendingVotes(voteSignerAccount)
    const hasActivatable = await election.hasActivatablePendingVotes(voteSignerAccount)

    const activates = await election.activate(voteSignerAccount);
    console.log('activates', activates, hasPendingVotes, hasActivatable)
    //TODO: activate returns an array
    //find activates only for Figment validator group
    const activate = activates.pop();
    if (!activate) return new BigNumber(0); //throw error instead? or should be thrown in diff place?

    gas = await activate.txo.estimateGas({ from: account.freshAddress });
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
