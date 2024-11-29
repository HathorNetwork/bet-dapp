import type { NextApiRequest, NextApiResponse } from 'next'
import { createNanoContract, getAllNanoContracts, getNanoContractsByCreator, NanoContract } from '@/lib/dynamodb/nano-contract';
import { z } from 'zod';

export interface ErrorResponse {
  error: {
    message: string;
    errors?: unknown;
  }
}

const nanoContractSchema = z.object({
  id: z.string(),
  title: z.string(),
  oracleType: z.string(),
  oracle: z.string(),
  description: z.string().optional(),
  timestamp: z.number(),
  creatorAddress: z.string(),
  createdAt: z.number(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | NanoContract | NanoContract[]>
) {
  const { method } = req;

  switch (method) {
    case 'POST':
      return create(req, res);
    case 'GET':
      return listAll(req, res);
    default: 
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).json({
        error: { message: `Method ${method} Not Allowed` },
      });
  }
}

export async function create(
  req: NextApiRequest,
  res: NextApiResponse<ErrorResponse | NanoContract>
) {
  const body = nanoContractSchema.safeParse(req.body);

  if (!body.success) {
    const { errors } = body.error;

    return res.status(400).json({
      error: { message: 'Invalid request', errors },
    });
  }

  const now = new Date().getTime();

  const data: NanoContract = await createNanoContract({
    ...body.data,
    createdAt: now,
  });


  res.status(200).json(data);
}

const listAllQuerySchema = z.object({
  creator_address: z.string().optional()
});

export async function listAll(
  req: NextApiRequest,
  res: NextApiResponse<NanoContract[] | { error: string }>
) {
  try {
    const query = listAllQuerySchema.parse(req.query);

    let nanoContracts: NanoContract[];

    if (query.creator_address) {
      // If creator_address is provided, fetch contracts for that creator
      nanoContracts = await getNanoContractsByCreator(query.creator_address);
    } else {
      // Otherwise, fetch all contracts
      nanoContracts = await getAllNanoContracts();
    }

    res.status(200).json(nanoContracts);
  } catch (error) {
    console.error('Error fetching nano contracts:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }

    res.status(500).json({ error: 'Failed to fetch nano contracts' });
  }
}
