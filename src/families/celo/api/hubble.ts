import { BigNumber } from "bignumber.js";
import network from "../../../network";
import { getEnv } from "../../../env";
import { Operation, OperationType } from "../../../types";
import { encodeOperationId } from "../../../operation";
import { CeloValidatorGroup } from "../types";
import { isDefaultValidatorGroup } from "../logic";
import { celoKit } from "./sdk";

const DEFAULT_TRANSACTIONS_LIMIT = 200;
const getUrl = (route): string => `${getEnv("API_CELO_INDEXER")}${route || ""}`;

// Indexer returns both account data and transactions in one call.
// Transactions are just limited, there's no block height offset
const fetchAccountDetails = async (
  address: string,
  transactionsLimit: number = DEFAULT_TRANSACTIONS_LIMIT
) => {
  const { data } = await network({
    method: "GET",
    url: getUrl(`/account_details/${address}?limit=${transactionsLimit}`),
  });
  return data;
};

const fetchStatus = async () => {
  const { data } = await network({
    method: "GET",
    url: getUrl(`/status`),
  });
  return data;
};

const fetchValidatorGroups = async () => {
  const { data } = await network({
    method: "GET",
    url: getUrl(`/validator_groups`),
  });
  return data.items;
};

//TODO: fetch extra - validator group addresses for vote etc. Rename freeze -> lock etc

const getOperationType = (type: string): OperationType => {
  switch (type) {
    case "InternalTransferSent":
      return "OUT";
    case "InternalTransferReceived":
      return "IN";
    case "GoldLocked":
      return "LOCK";
    case "GoldUnlocked":
      return "UNLOCK";
    case "GoldWithdrawn":
      return "WITHDRAW";
    case "ValidatorGroupVoteCastSent":
      return "VOTE";
    //  TODO: revoke, ACTIVATE, REGISTER
    case "RewardReceived":
      return "REWARD";
    case "AccountSlashed":
      return "SLASH";
    default:
      return "NONE";
  }
};

const transactionToOperation = (
  address: string,
  accountId: string,
  transaction
): Operation => {
  const type: OperationType = getOperationType(transaction.kind);
  const hasFailed = transaction.data.success
    ? !transaction.data.success
    : false;
  const senders = transaction.data.from ? [transaction.data.from] : [];
  const recipients = transaction.data.to ? [transaction.data.to] : [];

  // if locked, remove sent transaction?
  return {
    id: encodeOperationId(accountId, transaction.transaction_hash, type),
    hash: transaction.transaction_hash,
    accountId,
    fee: new BigNumber(0),
    value: adjustValueForType(new BigNumber(transaction.amount), type),
    type,
    blockHeight: transaction.height,
    date: new Date(transaction.time),
    senders,
    recipients,
    hasFailed,
    blockHash: null,
    extra: {},
  };
};

export const getAccountDetails = async (address: string, accountId: string) => {
  const accountDetails = await fetchAccountDetails(address);
  const spendableBalance = new BigNumber(accountDetails.gold_balance);
  const lockedBalance = new BigNumber(accountDetails.total_locked_gold);
  const nonvotingLockedBalance = new BigNumber(
    accountDetails.total_nonvoting_locked_gold
  );
  const balance = spendableBalance.plus(lockedBalance);
  const indexerStatus = await fetchStatus();

  //TODO: refactor, cache, move to sdk
  const kit = celoKit();
  const lockedGold = await kit.contracts.getLockedGold();

  const allTransactions = accountDetails.internal_transfers
    .filter((transfer) => {
      transfer.data?.to != lockedGold.address &&
        transfer.data?.from != lockedGold.address;
    })
    .concat(accountDetails.transactions);

  const operations = allTransactions.map((transaction) =>
    transactionToOperation(address, accountId, transaction)
  );

  return {
    blockHeight: indexerStatus.last_indexed_height,
    balance,
    spendableBalance,
    operations,
    lockedBalance,
    nonvotingLockedBalance,
  };
};

export const getValidatorGroups = async (): Promise<CeloValidatorGroup[]> => {
  const validatorGroups = await fetchValidatorGroups();

  const result = validatorGroups.map((validatorGroup) => ({
    address: validatorGroup.address,
    name: validatorGroup.name || validatorGroup.address,
    votes: new BigNumber(validatorGroup.active_votes).plus(
      new BigNumber(validatorGroup.pending_votes)
    ),
  }));
  return customValidatorGroupsOrder(result);
};

const customValidatorGroupsOrder = (validatorGroups): CeloValidatorGroup[] => {
  let sortedValidatorGroups = validatorGroups.sort((a, b) =>
    b.votes.minus(a.votes)
  );

  const defaultValidatorGroup = sortedValidatorGroups.find(
    isDefaultValidatorGroup
  );

  if (defaultValidatorGroup) {
    sortedValidatorGroups = sortedValidatorGroups.filter(
      (validatorGroup) => !isDefaultValidatorGroup(validatorGroup)
    );
    sortedValidatorGroups.unshift(defaultValidatorGroup);
  }

  return sortedValidatorGroups;
};

const adjustValueForType = (amount: BigNumber, type): BigNumber => {
  if (["LOCK", "VOTE"].includes(type)) return amount.multipliedBy(-1);
  return amount;
};
