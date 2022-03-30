import { ContractKit, newKit } from "@celo/contractkit";
import { getEnv } from "../../../env";

let kit: ContractKit;
export const celoKit = () => {
  if (!kit) kit = newKit(getEnv("API_CELO_NODE"));
  return kit;
};

/**
 * Fetch account registered status. To lock any Celo, account needs to be registered first
 */
export const getAccountRegistrationStatus = async (address: string) => {
  const kit = celoKit();
  const accounts = await kit.contracts.getAccounts();
  return await accounts.isAccount(address);
};

export const getPendingWithdrawals = async (address: string) => {
  const kit = celoKit();
  const lockedGold = await kit.contracts.getLockedGold();
  const pendingWithdrawals = await lockedGold.getPendingWithdrawals(address);
  return pendingWithdrawals;
};
