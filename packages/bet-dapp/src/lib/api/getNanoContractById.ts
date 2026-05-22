import { NanoContract } from '../dynamodb/nano-contract';

export const getNanoContractById = async (id: string) => {
  const response: Response = await fetch(`/api/nano_contracts/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    throw new Error('Request failed.');
  }

  const data = await response.json();

  return data as NanoContract;
}
