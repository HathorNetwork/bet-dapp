import NanoContract from '@hathor/wallet-lib/lib/nano_contracts/nano_contract';

export const createNanoContractTx = async (
  nanoContract: NanoContract,
  title: string,
  description: string,
  oracleType: string,
  oracle: string,
  timestamp: number,
  creatorAddress: string,
  createdAt: number,
  options: string[],
) => {
  const response: Response = await fetch('/api/nano_contracts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: nanoContract.hash,
      timestamp,
      title,
      oracleType,
      oracle,
      description,
      creatorAddress,
      createdAt,
      options,
    }),
  });

  if (response.status !== 200) {
    throw new Error('Error creating nano contract.');
  }

  return response.json();
}
