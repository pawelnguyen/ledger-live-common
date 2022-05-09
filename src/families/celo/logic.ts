import { Account } from "../../types";
import {
  CeloPendingWithdrawal,
  CeloRevoke,
  CeloValidatorGroup,
  CeloVote,
} from "./types";

export const PRELOAD_MAX_AGE = 10 * 60 * 1000;
export const LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS =
  "0x0861a61Bf679A30680510EcC238ee43B82C5e843";

export const availablePendingWithdrawals = (
  account: Account
): CeloPendingWithdrawal[] => {
  const { pendingWithdrawals } = account.celoResources || {};

  return (pendingWithdrawals || []).filter(
    (withdrawal) => new Date(withdrawal.time.toNumber() * 1000) < new Date()
  );
};

export const isDefaultValidatorGroupAddress = (address: string): boolean =>
  address === LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS;

export const isDefaultValidatorGroup = (
  validatorGroup: CeloValidatorGroup
): boolean => isDefaultValidatorGroupAddress(validatorGroup.address);

export const activatableVotes = (account: Account): CeloVote[] => {
  const { votes } = account.celoResources || {};

  return (votes || []).filter((vote) => vote.activatable);
};

// TODO: refactor?
export const revokes = (account: Account): CeloRevoke[] => {
  const { votes } = account.celoResources || {};

  const revokes: CeloRevoke[] = [];
  votes?.forEach((vote) => {
    if (vote.pendingAmount.gt(0))
      revokes.push({
        validatorGroup: vote.validatorGroup,
        index: 0,
        amount: vote.pendingAmount,
        activeStatus: false,
      });
    if (vote.activeAmount.gt(0))
      revokes.push({
        validatorGroup: vote.validatorGroup,
        index: 1,
        amount: vote.activeAmount,
        activeStatus: true,
      });
  });

  return revokes;
};

export const getRevoke = (
  account: Account,
  validatorGroupAddress: string,
  index: number | null | undefined
): CeloRevoke | undefined => {
  return revokes(account).find(
    (revoke) =>
      revoke.validatorGroup === validatorGroupAddress && revoke.index == index
  );
};
