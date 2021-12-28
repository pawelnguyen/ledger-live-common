import { BigNumber } from "bignumber.js";
import { Account, Transaction } from "../../types";
import { celoKit } from "./api/sdk";

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
