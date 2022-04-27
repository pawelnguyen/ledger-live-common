import { ContractKit, newKit } from "@celo/contractkit";
import { getEnv } from "../../../env";
import { CeloVote } from "../types";
import { makeLRUCache } from "../../../cache";

let kit: ContractKit;
export const celoKit = () => {
  if (!kit) kit = newKit(getEnv("API_CELO_NODE"));
  return kit;
};

/**
 * Fetch account registered status. To lock any Celo, account needs to be registered first
 */
export const getAccountRegistrationStatus = async (address: string): Promise<boolean> => {
  const accounts = await celoKit().contracts.getAccounts();
  return await accounts.isAccount(address);
};

/**
 * Fetch pending withdrawals, with an index
 */
export const getPendingWithdrawals = async (address: string) => {
  const lockedGold = await celoKit().contracts.getLockedGold();
  const pendingWithdrawals = await lockedGold.getPendingWithdrawals(address);
  const pendingWithdrawalsWithIndexes = pendingWithdrawals
    .map((withdrawal, index) => ({
      ...withdrawal,
      index,
    }))
    .sort((a, b) => a.time.minus(b.time).toNumber());
  return pendingWithdrawalsWithIndexes;
};

/**
 * Fetch all votes, with an `activatable` flag for votes that can be activated
 */
export const getVotes = async (address: string): Promise<CeloVote[]> => {
  const election = await celoKit().contracts.getElection();
  const voter = await election.getVoter(await voteSignerAccount(address));
  const activates = await getActivateTransactionObjects(address);
  const activatableValidatorGroups = activates.map(
    (activate) => activate.txo.arguments[0]
  );
  return voter.votes.map((vote) => ({
    validatorGroup: vote.group,
    pendingAmount: vote.pending,
    activeAmount: vote.active,
    activatable: activatableValidatorGroups.includes(vote.group),
  }));
};

const getActivateTransactionObjects = async (address: string) => {
  const election = await celoKit().contracts.getElection();
  return await election.activate(await voteSignerAccount(address));
};

/**
 * Fetch and cache address of a vote signer account
 */
export const voteSignerAccount = makeLRUCache(
  async (address: string): Promise<string> => {
    const accounts = await celoKit().contracts.getAccounts();
    return await accounts.voteSignerToAccount(address);
  },
  (address) => address,
  {
    maxAge: 60 * 60 * 1000, // 1 hour
  }
);
