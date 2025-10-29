import React, { useState } from 'react';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { RpcMethodCard } from './rpc-method-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * RPC Tester component - A polished interface for testing RPC calls through WalletConnect
 * Similar to SnapTester but for WalletConnect RPC methods
 */
export const RpcTester: React.FC = () => {
  const { client, session, connect } = useWalletConnectClient();
  const [isExecutingMethod, setIsExecutingMethod] = useState<boolean>(false);

  const isConnected = session !== null;

  return (
    <>
      <div className="flex-1 p-6 space-y-6">
        {/* Connect WalletConnect Section */}
        {!isConnected && (
          <Card className="p-6 bg-hathor-yellow-500/10 border-hathor-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
                <p className="text-gray-400">
                  First, connect your wallet via WalletConnect to enable RPC testing
                </p>
              </div>
              <Button
                onClick={connect}
                size="lg"
                className="bg-hathor-yellow-500 hover:bg-hathor-yellow-600 text-black font-semibold"
              >
                Connect Wallet
              </Button>
            </div>
          </Card>
        )}

        {/* RPC Methods Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">RPC Methods</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RpcMethodCard
              title="Placeholder Method"
              description="This is a placeholder card for RPC methods"
              disabled={isExecutingMethod || !isConnected}
            />
          </div>
        </section>
      </div>
    </>
  );
};