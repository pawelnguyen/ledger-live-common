// @flow
import type { CeloResources, CeloResourcesRaw } from "./types";
import { BigNumber } from "bignumber.js";

export function toCeloResourcesRaw(r: CeloResources): CeloResourcesRaw {
  const { registrationStatus, lockedBalance, nonvotingLockedBalance } = r;
  return {
    registrationStatus,
    lockedBalance: lockedBalance.toString(),
    nonvotingLockedBalance: nonvotingLockedBalance.toString(),
  };
}

export function fromCeloResourcesRaw(r: CeloResourcesRaw): CeloResources {
  const { registrationStatus, lockedBalance, nonvotingLockedBalance } = r;
  return {
    registrationStatus,
    lockedBalance: new BigNumber(lockedBalance),
    nonvotingLockedBalance: new BigNumber(nonvotingLockedBalance),
  };
}
