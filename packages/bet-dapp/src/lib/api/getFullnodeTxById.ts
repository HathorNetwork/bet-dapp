import { txApi } from '@hathor/wallet-lib';

interface Tx {
  hash: string;
  nonce: string;
  timestamp: number;
  version: number;
  weight: number;
  signal_bits: number;
  parents: string[];
  inputs: any[];
  outputs: any[];
  tokens: any[];
  nc_id: string;
  nc_blueprint_id: string;
  nc_method: string;
  nc_args: string;
  nc_pubkey: string;
  raw: string;
}

interface Meta {
  hash: string;
  spent_outputs: any[];
  received_by: any[];
  children: string[];
  conflict_with: any[];
  voided_by: any[];
  twins: any[];
  accumulated_weight: number;
  score: number;
  height: number;
  min_height: number;
  feature_activation_bit_counts: any | null;
  first_block: string;
  validation: string;
  nc_block_root_id: any | null;
  first_block_height: number;
}

interface ResponseObject {
  success: boolean;
  tx: Tx;
  meta: Meta;
  spent_outputs: any;
}

export const getFullnodeTxById = async (txId: string): Promise<ResponseObject> => {
  const txReq: ResponseObject = await new Promise((resolve) => txApi.getTransaction(txId, resolve));

  if (!txReq.success) {
    console.error(txReq);
    throw new Error('Request to fullnode failed.');
  }

  return txReq;
}
