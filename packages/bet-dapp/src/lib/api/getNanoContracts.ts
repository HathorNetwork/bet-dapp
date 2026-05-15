import { URL } from '@/constants';

export const getNanoContracts = async () => {
  const response: Response = await fetch(`${URL}/api/nano_contracts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    throw new Error('Request failed.');
  }

  return response.json();
}
