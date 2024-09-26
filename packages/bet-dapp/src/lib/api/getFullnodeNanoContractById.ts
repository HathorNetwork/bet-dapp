import { ncApi } from '@hathor/wallet-lib';
import { NanoContractStateAPIResponse } from '@hathor/wallet-lib/lib/nano_contracts/types';

export const getFullnodeNanoContractById = async (ncId: string, address?: string | undefined | null): Promise<NanoContractStateAPIResponse> => {
  const fields = [
    'final_result',
    'bets_total',
    'total',
    'date_last_bet',
  ];

  const calls = address ? [`get_max_withdrawal("a'${address}'")`] : [];
  const state = await ncApi.getNanoContractState(ncId, fields, [], calls);

  if (!state.success) {
    throw new Error('Request to fullnode failed.');
  }

  return state;
}