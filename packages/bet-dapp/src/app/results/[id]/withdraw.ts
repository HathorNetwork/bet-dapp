import { IHathorRpc } from '@/contexts/JsonRpcContext';
import {
  sendNanoContractTxRpcRequest,
} from 'hathor-rpc-handler-test';
import { BET_BLUEPRINT } from '@/constants';
import { NanoContractActionType } from '@hathor/wallet-lib/lib/nano_contracts/types';

export const withdraw = async (
  hathorRpc: IHathorRpc,
  address: string,
  ncId: string,
  amount: number,
  token: string,
) => {
  const setResultNcTx = sendNanoContractTxRpcRequest(
    'withdraw',
    BET_BLUEPRINT,
    [{
      type: NanoContractActionType.WITHDRAWAL,
      address,
      amount,
      token,
      changeAddress: address,
    }],
    [],
    true,
    ncId,
  );

  return await hathorRpc.sendNanoContractTx(setResultNcTx);
};
