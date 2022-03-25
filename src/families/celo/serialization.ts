// @flow
import type { CeloResources, CeloResourcesRaw } from "./types";
import { BigNumber } from "bignumber.js";

export function toCeloResourcesRaw(r: CeloResources): CeloResourcesRaw {
  const {
    registrationStatus,
    lockedBalance,
    unlockedBalance,
    unlockingBalance,
  } = r;
  return {
    registrationStatus,
    lockedBalance: lockedBalance.toString(),
    unlockedBalance: unlockedBalance.toString(),
    unlockingBalance: unlockingBalance.toString(),
  };
}

export function fromCeloResourcesRaw(r: CeloResourcesRaw): CeloResources {
  const {
    registrationStatus,
    lockedBalance,
    unlockedBalance,
    unlockingBalance,
  } = r;
  return {
    registrationStatus,
    lockedBalance: new BigNumber(lockedBalance),
    unlockedBalance: new BigNumber(unlockedBalance),
    unlockingBalance: new BigNumber(unlockingBalance),
  };
}
