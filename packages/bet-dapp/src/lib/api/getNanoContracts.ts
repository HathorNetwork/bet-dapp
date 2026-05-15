export const getNanoContracts = async () => {
  const response: Response = await fetch('/api/nano_contracts', {
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
