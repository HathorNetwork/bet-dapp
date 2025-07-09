import { IHathorRpc } from '@/contexts/JsonRpcContext';
import { SendNanoContractRpcRequest, sendNanoContractTxRpcRequest } from 'hathor-rpc-handler-test';
import { SendNanoContractTxResponse } from '@hathor/hathor-rpc-handler';
import { BET_BLUEPRINT, EVENT_TOKEN } from '@/constants';
import { NanoContractActionType } from '@hathor/wallet-lib/lib/nano_contracts/types';
import { getAddressHex } from '@/lib/utils';

export const createBet = async (
  hathorRpc: IHathorRpc,
  address: string,
  ncId: string,
  result: string,
  amount: number,
) => {
  const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
    'bet',
    BET_BLUEPRINT, [{
      type: NanoContractActionType.DEPOSIT,
      token: EVENT_TOKEN,
      // @ts-ignore
      amount: `${Math.round(amount * 100)}`,
      // address: 'WeBBm1LfKBH3V5rEL5DAHtjjDiAws3Z83m',
      changeAddress: address,
    }], [
    address,
    result,
  ],
    true,
    ncId,
  );

  const rpcResponse: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq);

  return rpcResponse;
};
