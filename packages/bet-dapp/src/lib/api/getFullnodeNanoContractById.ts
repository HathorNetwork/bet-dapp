import { ncApi } from '@hathor/wallet-lib';
import { NanoContractStateAPIResponse } from '@hathor/wallet-lib/lib/nano_contracts/types';

export const getFullnodeNanoContractById = async (ncId: string, address: string | undefined | null): Promise<NanoContractStateAPIResponse> => {
  const fields = [
    'final_result',
    'total',
    'date_last_bet',
  ];

  const calls = address ? [`get_max_withdrawal("a'${address}'")`] : [];

  const state = await ncApi.getNanoContractState(ncId, fields, [], calls);

  if (!state.success) {
    console.log(state);
    throw new Error('Request to fullnode failed.');
  }

  return state;
}
