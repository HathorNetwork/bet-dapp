'use client';

import { RpcTester } from '@/components/rpcs/rpc-tester';

export default function RpcTestClient() {
  return (
    <div className="container mx-auto p-4 max-w-[1500px]">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-kuenstler">RPC Testing Interface</h1>
        <p className="text-gray-400">Test RPC methods via WalletConnect and view results in real-time</p>
      </div>

      <RpcTester />
    </div>
  );
}
