import { URL } from '@/constants';
import { NanoContract } from '../dynamodb/nano-contract';

export const getNanoContractById = async (id: string) => {
  const response: Response = await fetch(`${URL}/api/nano_contracts/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    console.log(response.json());
    throw new Error('Request failed.');
  }

  const data = await response.json();

  return data as NanoContract;
}
