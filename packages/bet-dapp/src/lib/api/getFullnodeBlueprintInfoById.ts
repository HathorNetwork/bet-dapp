import { ncApi } from '@hathor/wallet-lib';
import { NanoContractBlueprintInformationAPIResponse } from '@hathor/wallet-lib/lib/nano_contracts/types';

export const getFullnodeBlueprintInfoById = async (blueprintId: string): Promise<NanoContractBlueprintInformationAPIResponse> => {
  const info = await ncApi.getBlueprintInformation(blueprintId);

  return info;
}
