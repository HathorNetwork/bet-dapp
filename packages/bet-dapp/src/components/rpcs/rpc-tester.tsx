import React, { useState } from 'react';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { RpcMethodCard } from './rpc-method-card';
import { RpcWalletConnect } from './rpc-walletconnect';
import { Card } from '@/components/ui/card';
import { createRpcHandlers } from './rpc-method-handlers';
import { useWalletState } from '@/contexts/WalletStateContext';
import { AlertTriangle } from 'lucide-react';

/**
 * RPC Tester component - A polished interface for testing RPC calls through WalletConnect
 * Similar to SnapTester but for WalletConnect RPC methods
 */
export const RpcTester: React.FC = () => {
  const { client, session } = useWalletConnectClient();
  const { updateAddress, updateNetwork } = useWalletState();
  const [isExecutingMethod, setIsExecutingMethod] = useState<boolean>(false);

  const isConnected = !!session;

  // Create RPC handlers
  const rpcHandlers = createRpcHandlers({
    client,
    session,
    updateAddress,
    updateNetwork,
  });

  // Wrap RPC methods with error handler
  const wrapWithErrorHandler = <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      setIsExecutingMethod(true);
      try {
        const result = await fn(...args);
        return result;
      } catch (error) {
        console.error('RPC method error:', error);
        throw error;
      } finally {
        setIsExecutingMethod(false);
      }
    };
  };

  const getRpcWalletInformation = wrapWithErrorHandler(rpcHandlers.getRpcWalletInformation);

  return (
    <>
      <div className="flex-1 p-6 space-y-6">
        {/* WalletConnect Connection Widget */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">WalletConnect Session</h2>
            <p className="text-sm text-gray-400">
              {isConnected ? 'Connected and ready to test RPC methods' : 'Connect your wallet to begin testing'}
            </p>
          </div>
          <RpcWalletConnect />
        </div>

        {/* Warning if not connected */}
        {!isConnected && (
          <Card className="p-4 bg-orange-900/10 border-orange-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-200">
                <span className="font-semibold">Not Connected:</span>{' '}
                Please connect your wallet using the button above to enable RPC testing.
              </div>
            </div>
          </Card>
        )}

        {/* RPC Methods Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Wallet Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RpcMethodCard
              title="Get Wallet Information"
              description="Retrieve Network and Address 0 simultaneously (does not require confirmation)"
              onExecute={getRpcWalletInformation}
              disabled={isExecutingMethod || !isConnected}
              method="htr_getWalletInformation"
              params={[]}
            />
          </div>
        </section>
      </div>
    </>
  );
};