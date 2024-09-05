import { IHathorRpc } from '@/contexts/JsonRpcContext';
import { SendNanoContractRpcRequest, SendNanoContractTxResponse, sendNanoContractTxRpcRequest } from 'hathor-rpc-handler-test';
import { BET_BLUEPRINT } from '@/constants';
import { getOracleBuffer, waitForTransactionConfirmation } from '@/lib/utils';
import NanoContract from '@hathor/wallet-lib/lib/nano_contracts/nano_contract';
import { createNanoContractTx } from '@/lib/api/createNanoContractTx';

export const createNc = async (
  hathorRpc: IHathorRpc,
  title: string,
  description: string,
  oracleType: string,
  oracle: string,
  timestamp: number,
  token: string,
): Promise<NanoContract> => {
  const ncTxRpcReq: SendNanoContractRpcRequest = sendNanoContractTxRpcRequest(
    'initialize',
    BET_BLUEPRINT,
    [],
    [
      getOracleBuffer(oracle),
      token,
      timestamp,
    ],
    true,
    null,
  );

  const result: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq);
  const nanoContract = result.response as unknown as NanoContract;

  if (!nanoContract.timestamp) {
    throw new Error('No timestamp received in transaction');
  }

  await createNanoContractTx(nanoContract, title, description, oracleType, oracle, timestamp, nanoContract.timestamp);

  return nanoContract;
};
