import { IHathorRpc } from '@/contexts/JsonRpcContext';
import {
  SignOracleDataResponse,
  SignOracleDataRpcRequest,
  sendNanoContractTxRpcRequest,
  signOracleDataRpcRequest
} from 'hathor-rpc-handler-test';
import { BET_BLUEPRINT, NETWORK } from '@/constants';

export const setResult = async (
  hathorRpc: IHathorRpc,
  ncId: string,
  oracle: string,
  result: string
) => {
  const signOracleDataRpcReq: SignOracleDataRpcRequest = signOracleDataRpcRequest(
    NETWORK,
    result,
    oracle,
  );

  const oracleData: SignOracleDataResponse = await hathorRpc.signOracleData(signOracleDataRpcReq);
  const { signature } = oracleData.response;

  const setResultNcTx = sendNanoContractTxRpcRequest(
    'set_result',
    BET_BLUEPRINT,
    [],
    [signature],
    true,
    ncId,
  );

  await hathorRpc.sendNanoContractTx(setResultNcTx);
};
