import React, { useState, useMemo, useEffect } from 'react';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { RpcMethodCard } from './rpc-method-card';
import { RpcGetBalanceCard } from './rpc-get-balance-card';
import { RpcSignWithAddressCard } from './rpc-sign-with-address-card';
import { RpcSignOracleDataCard } from './rpc-sign-oracle-data-card';
import { RpcWalletConnect } from './rpc-walletconnect';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createRpcHandlers } from './rpc-method-handlers';
import { useWalletState } from '@/contexts/WalletStateContext';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, Copy, Wallet } from 'lucide-react';
import { get } from 'lodash';

/**
 * RPC Tester component - A polished interface for testing RPC calls through WalletConnect
 * Similar to SnapTester but for WalletConnect RPC methods
 */
export const RpcTester: React.FC = () => {
  const { client, session } = useWalletConnectClient();
  const { walletState, updateAddress, updateNetwork, updateBalance } = useWalletState();
  const { toast } = useToast();
  const [isExecutingMethod, setIsExecutingMethod] = useState<boolean>(false);
  const [balanceTokens, setBalanceTokens] = useState<string[]>(['00']);

  const isConnected = !!session;

  // Extract network and address from session
  const sessionInfo = useMemo(() => {
    if (!session) {
      return { network: null, address: null };
    }

    const accountString = get(session, 'namespaces.hathor.accounts[0]', '::');
    const [_, network, address] = accountString.split(':');

    return {
      network: network || null,
      address: address || null,
    };
  }, [session]);

  // Populate wallet state from session when connected
  useEffect(() => {
    if (!sessionInfo.address || !sessionInfo.network) {
      return;
    }

    // Check if network needs updating
    const currentNetwork = walletState.network?.network;
    if (currentNetwork !== sessionInfo.network) {
      updateNetwork({
        network: sessionInfo.network,
        genesisHash: '',
      });
      console.log('[RPC Tester] Network updated in wallet state:', sessionInfo.network);
    }

    // Check if address 0 needs updating
    const currentAddress = walletState.addresses.get(0);
    if (!currentAddress || currentAddress.address !== sessionInfo.address) {
      updateAddress({
        address: sessionInfo.address,
        index: 0,
        addressPath: "m/44'/280'/0'/0/0",
      });
      console.log('[RPC Tester] Address 0 updated in wallet state:', sessionInfo.address);
    }
  }, [sessionInfo.address, sessionInfo.network, walletState.network, walletState.addresses]);

  // Create RPC handlers
  const rpcHandlers = createRpcHandlers({
    client,
    session,
    updateAddress,
    updateNetwork,
    updateBalance,
    balanceTokens,
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
  const getRpcBalance = wrapWithErrorHandler(rpcHandlers.getRpcBalance);
  const getRpcSignWithAddress = wrapWithErrorHandler(rpcHandlers.getRpcSignWithAddress);
  const getRpcSignOracleData = wrapWithErrorHandler(rpcHandlers.getRpcSignOracleData);

  const handleCopyAddress = () => {
    if (sessionInfo.address) {
      navigator.clipboard.writeText(sessionInfo.address);
      toast({
        title: 'Copied',
        description: 'Address copied to clipboard',
      });
    }
  };

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

        {/* Wallet Information Visualization */}
        {isConnected && sessionInfo.address && (
          <Card className="p-4 bg-blue-900/10 border-blue-500/30">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-blue-400 mb-3">Wallet Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Network */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
                    <div className="text-xs text-gray-400 mb-1">Network</div>
                    <div className="font-mono text-sm text-gray-200">
                      {sessionInfo.network || 'Unknown'}
                    </div>
                  </div>
                  {/* Address 0 */}
                  <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-gray-400">Address 0</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyAddress}
                        className="h-6 w-6 p-0 hover:bg-gray-800"
                        title="Copy address"
                      >
                        <Copy className="h-3 w-3 text-gray-400 hover:text-blue-400" />
                      </Button>
                    </div>
                    <div className="font-mono text-xs text-gray-200 break-all">
                      {sessionInfo.address}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

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
              description="[❌ Disabled for RPCs] Retrieve Network and Address 0 simultaneously (does not require confirmation)"
              onExecute={getRpcWalletInformation}
              disabled={true || isExecutingMethod || !isConnected}
              method="htr_getWalletInformation"
              params={[]}
            />
            <RpcGetBalanceCard
              onExecute={getRpcBalance}
              disabled={isExecutingMethod || !isConnected}
              balanceTokens={balanceTokens}
              setBalanceTokens={setBalanceTokens}
            />
          </div>
        </section>

        {/* Signatures Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Signatures</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RpcSignWithAddressCard
              onExecute={getRpcSignWithAddress}
              disabled={isExecutingMethod || !isConnected}
              walletState={walletState}
            />
            <RpcSignOracleDataCard
              onExecute={getRpcSignOracleData}
              disabled={isExecutingMethod || !isConnected}
              walletState={walletState}
            />
          </div>
        </section>
      </div>
    </>
  );
};
