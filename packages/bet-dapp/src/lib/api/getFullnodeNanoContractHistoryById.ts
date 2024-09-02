import { ncApi } from '@hathor/wallet-lib';
import { IHistoryTx } from '@hathor/wallet-lib/lib/types';

const COUNT: number = 400;

export const getFullnodeNanoContractHistoryById = async (
  ncId: string,
  count = COUNT,
  before: string | null = null,
  after: string | null = null,
): Promise<IHistoryTx[]> => {
  const history = await ncApi.getNanoContractHistory(ncId, count, before, after);

  if (!history.success) {
    throw new Error('Request to fullnode failed.');
  }

  return history.history;
}
