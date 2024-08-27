import { URL } from '@/app/constants';

export const getNanoContracts = async () => {
  const response: Response = await fetch(`${URL}/api/nano_contracts`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status !== 200) {
    console.log(response.json());
    throw new Error('Request failed.');
  }

  return response.json();
}
