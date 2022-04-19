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

//TODO: desc, types
export const getPendingWithdrawals = async (address: string) => {
  const kit = celoKit();
  const lockedGold = await kit.contracts.getLockedGold();
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

//TODO: desc, types
export const getVotes = async (address: string) => {
  const kit = celoKit();

  const election = await kit.contracts.getElection();
  const accounts = await kit.contracts.getAccounts();
  const voteSignerAccount = await accounts.voteSignerToAccount(address);
  const voter = await election.getVoter(voteSignerAccount)

  return voter.votes;
};

//DRY
export const getActivates = async (address: string) => {
  const kit = celoKit();

  const election = await kit.contracts.getElection();
  const accounts = await kit.contracts.getAccounts();
  const voteSignerAccount = await accounts.voteSignerToAccount(address);
  return await election.activate(voteSignerAccount);
};

export const getPendingVotes = async (address: string) => {
  const votes = await getVotes(address);
  const activates = await getActivates(address);

  return activates.map((activate) => {
    return votes.find((vote) => vote.group === activate.txo.arguments[0])
  })
}


// TODO: fetch in sync, to enable/disable vote button
// const hasPendingVotes = await election.hasPendingVotes(voteSignerAccount);
// const hasActivatable = await election.hasActivatablePendingVotes(
//   voteSignerAccount
// );
