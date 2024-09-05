import { IHathorRpc } from '@/contexts/JsonRpcContext';
import { CreateTokenResponse, CreateTokenRpcRequest, createTokenRpcRequest } from 'hathor-rpc-handler-test';
import { NETWORK } from '@/constants';
import { CreateTokenTransaction, Transaction } from '@hathor/wallet-lib';

export const createToken = async (
  hathorRpc: IHathorRpc,
  title: string,
  description: string,
  amount: number,
): Promise<CreateTokenTransaction> => {
  const createTokenReq: CreateTokenRpcRequest = createTokenRpcRequest(
    true,
    NETWORK,
    title,
    description,
    amount,
  );

  const result: CreateTokenResponse = await hathorRpc.createToken(createTokenReq);

  return result.response;
};
