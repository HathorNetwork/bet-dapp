import { describe, expect, it, vi } from 'vitest';
import type { SendNanoContractRpcRequest } from '@hathor/hathor-rpc-handler';
import type { IHathorRpc } from '@/contexts/JsonRpcContext';
import { NETWORK } from '@/constants';

/**
 * Regression guard for the `network: Required` failure this branch fixes.
 *
 * hathor-rpc-handler began requiring a `network` param on
 * htr_sendNanoContractTx in 3.0.0, but its own request builder only started
 * emitting one in 4.0.0 — where it landed as the *first* positional argument.
 * For the whole 3.x line the library shipped a builder producing params its own
 * handler rejected, and no single repo exercised both halves: the dApp only
 * builds params, the wallet only parses them. Nothing asserted the contract.
 *
 * These tests drive the real call sites rather than the builder in isolation,
 * because the bug lived at the call sites. That also makes them sensitive to
 * the argument shift a future signature change would introduce: `network` is
 * positional, so a builder that grows another leading parameter silently moves
 * the method name into the network slot instead of failing loudly.
 */

// createNc persists to DynamoDB once the RPC resolves; stub it so this stays a
// pure assertion about the outgoing request.
vi.mock('@/lib/api/createNanoContractTx', () => ({
  createNanoContractTx: vi.fn().mockResolvedValue(undefined),
}));

const TESTNET_ADDRESS = 'WeBBm1LfKBH3V5rEL5DAHtjjDiAws3Z83m';
const NC_ID = '0000015ec35e6fa7b333644281eaf42068edac9b4a87149bc837ec6b769c7e2c';

/**
 * Captures the htr_sendNanoContractTx request a call site emits, returning a
 * response shaped just well enough for the caller to run to completion.
 */
function createCapturingRpc() {
  const requests: SendNanoContractRpcRequest[] = [];

  const hathorRpc: IHathorRpc = {
    sendNanoContractTx: async (req) => {
      requests.push(req);
      return {
        type: 'send-nano-contract-tx-response',
        response: { hash: NC_ID, timestamp: 1234567890 },
      } as never;
    },
    signOracleData: async () => ({
      type: 'sign-oracle-data-response',
      response: { signedData: 'cafe', oracle: TESTNET_ADDRESS },
    }) as never,
  };

  return { hathorRpc, requests };
}

/** Every write path in the dApp, each invoking the real exported function. */
const CALL_SITES: {
  name: string;
  method: string;
  run: (rpc: IHathorRpc) => Promise<unknown>;
}[] = [
  {
    name: 'createNc',
    method: 'initialize',
    run: async (rpc) => {
      const { createNc } = await import('@/app/create/createNc');
      return createNc(
        rpc, 'title', 'description', 'address', TESTNET_ADDRESS,
        1234567890, '00', TESTNET_ADDRESS, ['a', 'b'],
      );
    },
  },
  {
    name: 'createBet',
    method: 'bet',
    run: async (rpc) => {
      const { createBet } = await import('@/app/bet/[id]/createBet');
      return createBet(rpc, TESTNET_ADDRESS, NC_ID, 'a', 10);
    },
  },
  {
    name: 'setResult',
    method: 'set_result',
    run: async (rpc) => {
      const { setResult } = await import('@/app/set_result/[id]/setResult');
      return setResult(rpc, NC_ID, TESTNET_ADDRESS, 'a');
    },
  },
  {
    name: 'withdraw',
    method: 'withdraw',
    run: async (rpc) => {
      const { withdraw } = await import('@/app/results/[id]/withdraw');
      return withdraw(rpc, TESTNET_ADDRESS, NC_ID, 100, '00');
    },
  },
];

describe('htr_sendNanoContractTx params', () => {
  CALL_SITES.forEach(({ name, method, run }) => {
    it(`${name} sends network and method in the right slots`, async () => {
      const { hathorRpc, requests } = createCapturingRpc();

      await run(hathorRpc);

      expect(requests).toHaveLength(1);
      const params = requests[0].params as Record<string, unknown>;

      // The wallet validates this with `z.string().min(1)` and rejects the
      // request as `network: Required` when it is absent.
      expect(params.network).toBe(NETWORK);

      // Asserting the neighbouring field catches a positional shift, which is
      // the failure mode a caret-ranged builder upgrade would introduce: the
      // params stay well-formed but every value lands one slot over.
      expect(params.method).toBe(method);
    });
  });
});
