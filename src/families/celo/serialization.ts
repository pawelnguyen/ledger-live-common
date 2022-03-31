// @flow
import type { CeloResources, CeloResourcesRaw } from "./types";
import { BigNumber } from "bignumber.js";

export function toCeloResourcesRaw(r: CeloResources): CeloResourcesRaw {
  const {
    registrationStatus,
    lockedBalance,
    nonvotingLockedBalance,
    pendingWithdrawals,
  } = r;
  return {
    registrationStatus,
    lockedBalance: lockedBalance.toString(),
    nonvotingLockedBalance: nonvotingLockedBalance.toString(),
    pendingWithdrawals: pendingWithdrawals?.map((u) => ({
      value: u.value.toString(),
      time: u.time.toString(),
      index: u.index.toString(),
    })),
  };
}

export function fromCeloResourcesRaw(r: CeloResourcesRaw): CeloResources {
  const { registrationStatus, lockedBalance, nonvotingLockedBalance } = r;
  return {
    registrationStatus,
    lockedBalance: new BigNumber(lockedBalance),
    nonvotingLockedBalance: new BigNumber(nonvotingLockedBalance),
    pendingWithdrawals: r.pendingWithdrawals?.map((u) => ({
      value: new BigNumber(u.value),
      time: new BigNumber(u.time),
      index: Number(u.index),
    })),
  };
}
