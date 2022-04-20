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
  const accounts = await celoKit().contracts.getAccounts();
  return await accounts.isAccount(address);
};

//TODO: desc, types
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


// getVotes [
//   {
//     group: '0x01b2b83fDf26aFC3Ca7062C35Bc68c8DdE56dB04',
//     pending: BigNumber { s: 1, e: 16, c: [Array] },
// active: BigNumber { s: 1, e: 0, c: [Array] },
// index: 0
// },
// {
//   group: '0x0861a61Bf679A30680510EcC238ee43B82C5e843',
//     pending: BigNumber { s: 1, e: 16, c: [Array] },
//   active: BigNumber { s: 1, e: 0, c: [Array] },
//   index: 1
// }
// ]

export const getVotes = async (address: string) => {
  const election = await celoKit().contracts.getElection();
  const voter = await election.getVoter(await voteSignerAccount(address))
  return voter.votes;
};

export const getVoteActivates = async (address: string) => {
  const election = await celoKit().contracts.getElection();
  return await election.activate(await voteSignerAccount(address));
};

export const getPendingVotes = async (address: string) => {
  const votes = await getVotes(address);
  const activates = await getVoteActivates(address);

  return activates.map((activate) =>
    votes.find((vote) => vote.group === activate.txo.arguments[0])
  )
}

// TODO: fetch in sync, to enable/disable vote button
// const hasPendingVotes = await election.hasPendingVotes(voteSignerAccount);
// const hasActivatable = await election.hasActivatablePendingVotes(
//   voteSignerAccount
// );

const voteSignerAccount = async (address: string) => {
  const accounts = await celoKit().contracts.getAccounts();
  return await accounts.voteSignerToAccount(address);
}
