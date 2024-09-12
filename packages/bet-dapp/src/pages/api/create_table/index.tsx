import type { NextApiRequest, NextApiResponse } from 'next'
import { createTable, deleteTable } from '@/lib/dynamodb/nano-contract';

export interface ErrorResponse {
  error: {
    message: string;
    errors?: unknown;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | string>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return create(req, res);
    default: 
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

export async function create(
  _req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | string>
) {
  // await deleteTable();
  await createTable();

  res.status(200).json('ok');
}
