import { IHathorRpc } from '@/contexts/JsonRpcContext';
import { SendNanoContractRpcRequest, SendNanoContractTxResponse, sendNanoContractTxRpcRequest } from '@hathor/hathor-rpc-handler';
import { BET_BLUEPRINT } from '@/constants';
import { getOracleBuffer } from '@/lib/utils';
import { createNanoContractTx } from '@/lib/api/createNanoContractTx';
import { Transaction } from '@hathor/wallet-lib';

export const createNc = async (
  hathorRpc: IHathorRpc,
  title: string,
  description: string,
  oracleType: string,
  oracle: string,
  timestamp: number,
  token: string,
  creatorAddress: string,
  options: string[],
): Promise<Transaction> => {
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

  console.log(ncTxRpcReq);

  const result: SendNanoContractTxResponse = await hathorRpc.sendNanoContractTx(ncTxRpcReq);
  const nanoContract = result.response as unknown as Transaction;

  if (!nanoContract.timestamp) {
    throw new Error('No timestamp received in transaction');
  }

  console.log('Will create tx in dynamodb');
  await createNanoContractTx(
    nanoContract,
    title,
    description,
    oracleType,
    oracle,
    timestamp,
    creatorAddress,
    nanoContract.timestamp,
    options
  );
  console.log('done');

  return nanoContract;
};
