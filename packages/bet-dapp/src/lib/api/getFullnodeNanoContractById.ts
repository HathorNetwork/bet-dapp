import { ncApi } from '@hathor/wallet-lib';
import { NanoContractStateAPIResponse } from '@hathor/wallet-lib/lib/nano_contracts/types';

export const getFullnodeNanoContractById = async (ncId: string, address?: string | undefined | null, options?: string[]): Promise<NanoContractStateAPIResponse> => {
  const fields = [
    'final_result',
    'total',
    'date_last_bet',
  ];

  const calls = [];
  if (address) {
    calls.push(`get_max_withdrawal("${address}")`);
    fields.push(`address_details.${address}`);
  }

  if (options && options.length > 0) {
    options.forEach(option => {
      fields.push(`bets_total.${option}`);
    });
  }

  const state = await ncApi.getNanoContractState(ncId, fields, [], calls);

  if (!state.success) {
    throw new Error('Request to fullnode failed.');
  }

  return state;
}
