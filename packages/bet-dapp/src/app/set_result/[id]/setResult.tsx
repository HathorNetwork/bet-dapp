import { IHathorRpc } from '@/contexts/JsonRpcContext';
import {
  SignOracleDataResponse,
  SignOracleDataRpcRequest,
  sendNanoContractTxRpcRequest,
  signOracleDataRpcRequest
} from '@hathor/hathor-rpc-handler';
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
    ncId,
  );

  const oracleData: SignOracleDataResponse = await hathorRpc.signOracleData(signOracleDataRpcReq);
  const { signedData } = oracleData.response;


  const setResultNcTx = sendNanoContractTxRpcRequest(
    'set_result',
    BET_BLUEPRINT,
    [],
    [signedData],
    true,
    ncId,
  );

  return await hathorRpc.sendNanoContractTx(setResultNcTx);
};
