import NanoContract from '@hathor/wallet-lib/lib/nano_contracts/nano_contract';
import { URL } from '@/constants';

export const createNanoContractTx = async (
  nanoContract: NanoContract,
  title: string,
  description: string,
  oracleType: string,
  oracle: string,
  timestamp: number,
  createdAt: number,
) => {
  const response: Response = await fetch(`${URL}/api/nano_contracts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: nanoContract.hash,
      title,
      description,
      oracleType,
      oracle,
      timestamp,
      createdAt,
    }),
  });

  console.log('Created', {
    id: nanoContract.hash,
    title,
    description,
    oracleType,
    oracle,
    timestamp,
    createdAt,
  });

  if (response.status !== 200) {
    console.log(response.json());
    throw new Error('Error creating nano contract.');
  }

  return response.json();
}
