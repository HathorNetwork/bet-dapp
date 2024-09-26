import type { NextApiRequest, NextApiResponse } from 'next'
import { getNanoContractById, NanoContract } from '@/lib/dynamodb/nano-contract';
import { z } from 'zod';

export interface ErrorResponse {
  error: {
    message: string;
    errors?: unknown;
  }
}

const getByApiSchema = z.object({
  id: z.string()
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | NanoContract>
) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return getNanoContract(req, res);
    default: 
      res.setHeader('Allow', ['GET']);
      res.status(405).json({
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

export async function getNanoContract(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | NanoContract>
) {
  const queryParams = getByApiSchema.safeParse(req.query);

  if (!queryParams.success) {
    const { errors } = queryParams.error;

    return res.status(400).json({
      error: { message: 'Invalid request', errors },
    });
  }

  const nc = await getNanoContractById(queryParams.data.id);

  res.status(200).json(nc);
}
