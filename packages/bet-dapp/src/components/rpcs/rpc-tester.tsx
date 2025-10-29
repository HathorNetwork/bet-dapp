import React, { useState, useMemo, useEffect } from 'react';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { RpcMethodCard } from './rpc-method-card';
import { RpcGetBalanceCard } from './rpc-get-balance-card';
import { RpcSignWithAddressCard } from './rpc-sign-with-address-card';
import { RpcSignOracleDataCard } from './rpc-sign-oracle-data-card';
import { RpcSendTxCard, SendTxParams } from './rpc-send-tx-card';
import { RpcCreateTokenCard, CreateTokenParams } from './rpc-create-token-card';
import { RpcInitializeBetCard, InitializeBetParams } from './rpc-initialize-bet-card';
import { RpcBetCard, BetParams } from './rpc-bet-card';
import { RpcSetBetResultCard, SetResultParams } from './rpc-set-bet-result-card';
import { RpcWithdrawBetPrizeCard, WithdrawBetPrizeParams } from './rpc-withdraw-bet-prize-card';
import { RpcWalletConnect } from './rpc-walletconnect';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createRpcHandlers } from './rpc-method-handlers';
import { useWalletState } from '@/contexts/WalletStateContext';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, Copy, Wallet } from 'lucide-react';
import { get } from 'lodash';
import { TESTNET_INDIA_BET_BLUEPRINT_ID } from '@/components/snaps/constants';

/**
 * RPC Tester component - A polished interface for testing RPC calls through WalletConnect
 * Similar to SnapTester but for WalletConnect RPC methods
 */
export const RpcTester: React.FC = () => {
  const { client, session } = useWalletConnectClient();
  const { walletState, updateAddress, updateNetwork, updateBalance, updateBlueprint, updateBetNanoContract } = useWalletState();
  const { toast } = useToast();
  const [isExecutingMethod, setIsExecutingMethod] = useState<boolean>(false);
  const [balanceTokens, setBalanceTokens] = useState<string[]>(['00']);
  const [sendTxParams, setSendTxParams] = useState<SendTxParams>({
    outputs: [{ type: 'address', address: '', value: '1', token: '' }],
    inputs: [],
    changeAddress: '',
  });
  const [createTokenParams, setCreateTokenParams] = useState<CreateTokenParams>({
    name: 'Test Token',
    symbol: 'TST',
    amount: '100',
    change_address: '',
    create_mint: true,
    mint_authority_address: '',
    allow_external_mint_authority_address: false,
    create_melt: true,
    melt_authority_address: '',
    allow_external_melt_authority_address: false,
    data: []
  });

  // Bet-related states
  const [initializeBetParams, setInitializeBetParams] = useState<InitializeBetParams>({
    blueprintId: TESTNET_INDIA_BET_BLUEPRINT_ID,
    oracleAddress: '',
    token: '00',
    deadline: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    push_tx: false,
  });

  const [betParams, setBetParams] = useState<BetParams>({
    ncId: '',
    betChoice: '1x0',
    amount: 1,
    address: '',
    token: '00',
    push_tx: false,
  });

  const [setBetResultParams, setSetBetResultParams] = useState<SetResultParams>({
    ncId: '',
    oracle: '',
    result: '1x0',
    push_tx: false,
  });

  const [withdrawBetPrizeParams, setWithdrawBetPrizeParams] = useState<WithdrawBetPrizeParams>({
    ncId: '',
    address: '',
    amount: 100,
    token: '00',
    push_tx: false,
  });

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
  const getRpcSendTransaction = wrapWithErrorHandler(rpcHandlers.getRpcSendTransaction);
  const getRpcCreateToken = wrapWithErrorHandler(rpcHandlers.getRpcCreateToken);
  const getRpcInitializeBet = wrapWithErrorHandler(rpcHandlers.getRpcInitializeBet);
  const getRpcBet = wrapWithErrorHandler(rpcHandlers.getRpcBet);
  const getRpcSetResult = wrapWithErrorHandler(rpcHandlers.getRpcSetResult);
  const getRpcWithdrawBetPrize = wrapWithErrorHandler(rpcHandlers.getRpcWithdrawBetPrize);

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

        {/* Transactions Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Transactions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RpcSendTxCard
              onExecute={getRpcSendTransaction}
              disabled={isExecutingMethod || !isConnected}
              sendTxParams={sendTxParams}
              setSendTxParams={setSendTxParams}
              walletState={walletState}
            />
            <RpcCreateTokenCard
              onExecute={getRpcCreateToken}
              disabled={isExecutingMethod || !isConnected}
              createTokenParams={createTokenParams}
              setCreateTokenParams={setCreateTokenParams}
              walletState={walletState}
            />
          </div>
        </section>

        {/* Test Bet Blueprint Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Test Bet Blueprint</h2>
          <Card className="p-4 mb-4 bg-red-900/10 border border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <span className="font-semibold">Warning:</span>{' '}
                Only the address at index 0 will be used to sign ANY Nano Contract transaction when using RPC methods.
              </div>
            </div>
          </Card>

          {/* Blueprint ID Configuration */}
          <Card className="p-4 mb-4 bg-gray-900/30 border-gray-700">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-hathor-yellow-500">Blueprint ID</Label>
                <Input
                  value={walletState.blueprint?.blueprintId || ''}
                  onChange={(e) => updateBlueprint({ blueprintId: e.target.value })}
                  placeholder="Enter blueprint ID (e.g., 0000019865eda743812c566ce6ad3ac49c5f90796b73aa2792a09b7655ac5a5e)"
                  className="bg-gray-900/50 border-gray-700 text-sm font-mono"
                />
                <p className="text-xs text-gray-400">
                  This blueprint ID will be used across all nano contract operations below.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-hathor-yellow-500">Bet Nano Contract ID</Label>
                <Input
                  value={walletState.betNanoContract?.ncId || ''}
                  onChange={(e) => updateBetNanoContract({ ncId: e.target.value, hash: e.target.value })}
                  placeholder="Nano contract ID (automatically filled after Initialize)"
                  className="bg-gray-900/50 border-gray-700 text-sm font-mono"
                />
                <p className="text-xs text-gray-400">
                  This nano contract ID will be used for bet, set result, and withdraw operations. Automatically populated when you initialize a bet.
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RpcInitializeBetCard
              onExecute={getRpcInitializeBet}
              disabled={isExecutingMethod || !isConnected}
              createBetParams={initializeBetParams}
              setCreateBetParams={setInitializeBetParams}
            />
            <RpcBetCard
              onExecute={getRpcBet}
              disabled={isExecutingMethod || !isConnected}
              betParams={betParams}
              setBetParams={setBetParams}
            />
            <RpcSetBetResultCard
              onExecute={getRpcSetResult}
              disabled={isExecutingMethod || !isConnected}
              setResultParams={setBetResultParams}
              setSetResultParams={setSetBetResultParams}
            />
            <RpcWithdrawBetPrizeCard
              onExecute={getRpcWithdrawBetPrize}
              disabled={isExecutingMethod || !isConnected}
              withdrawBetPrizeParams={withdrawBetPrizeParams}
              setWithdrawBetPrizeParams={setWithdrawBetPrizeParams}
            />
          </div>
        </section>
      </div>
    </>
  );
};
