// @flow
import type { CeloResources, CeloResourcesRaw } from "./types";

export function toCeloResourcesRaw(r: CeloResources): CeloResourcesRaw {
  const { registrationStatus } = r;
  return { registrationStatus };
}

export function fromCeloResourcesRaw(r: CeloResourcesRaw): CeloResources {
  const { registrationStatus } = r;
  return { registrationStatus };
}
