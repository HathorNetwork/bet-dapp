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
import { AlertTriangle, Copy, Wallet, X, FlaskConical } from 'lucide-react';
import { get } from 'lodash';
import { TESTNET_INDIA_BET_BLUEPRINT_ID } from '@/components/snaps/constants';
import { getKnownTokens, removeKnownToken } from '@/lib/tokenStorage';
import type { KnownToken } from '@/lib/tokenStorage';
import Link from 'next/link';

/**
 * RPC Tester component - A polished interface for testing RPC calls through WalletConnect
 * Similar to SnapTester but for WalletConnect RPC methods
 */
export const RpcTester: React.FC = () => {
  const { client, session } = useWalletConnectClient();
  const { walletState, updateAddress, updateNetwork, updateBalance, updateBlueprint, updateBetNanoContract } = useWalletState();
  const { toast } = useToast();
  const [isExecutingMethod, setIsExecutingMethod] = useState<boolean>(false);
  const [isDryRun, setIsDryRun] = useState<boolean>(false);
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

  // Token storage editor state
  const [knownTokens, setKnownTokens] = useState<KnownToken[]>([]);

  // Load known tokens from localStorage on mount
  useEffect(() => {
    try {
      setKnownTokens(getKnownTokens());
    } catch (err) {
      console.error('Failed to load known tokens for editor:', err);
    }
  }, [balanceTokens]);

  const handleRemoveKnownToken = (tokenId: string) => {
    try {
      removeKnownToken(tokenId);
      setKnownTokens(getKnownTokens());
    } catch (err) {
      console.error('Failed to remove known token:', err);
    }
  };

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
    dryRun: isDryRun,
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
        {/* Top quick links */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/rpc" passHref>
            <Button asChild variant="secondary" size="sm">
              <a className="text-sm font-medium" target="_blank">Open raw RPC sender</a>
            </Button>
          </Link>
          <a href="https://staging.betting.hathor.network/rpc" target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              staging version
            </Button>
          </a>
        </div>

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

        {/* Dry Run Mode Toggle */}
        <Card className={`p-4 transition-colors ${isDryRun ? 'bg-purple-900/10 border-purple-500/30' : 'bg-gray-900/30 border-gray-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FlaskConical className={`h-5 w-5 ${isDryRun ? 'text-purple-400' : 'text-gray-400'}`} />
              <div>
                <h3 className="text-sm font-semibold">Dry Run Mode</h3>
                <p className="text-xs text-gray-400">
                  {isDryRun ? 'Requests will be generated but NOT sent to the RPC' : 'Execute will send actual RPC requests'}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="h-5 w-5 rounded border-gray-700 bg-gray-900 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-300">
                {isDryRun ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>
        </Card>

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
              isDryRun={isDryRun}
            />
            <RpcGetBalanceCard
              onExecute={getRpcBalance}
              disabled={isExecutingMethod || !isConnected}
              balanceTokens={balanceTokens}
              setBalanceTokens={setBalanceTokens}
              isDryRun={isDryRun}
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
              isDryRun={isDryRun}
            />
            <RpcSignOracleDataCard
              onExecute={getRpcSignOracleData}
              disabled={isExecutingMethod || !isConnected}
              walletState={walletState}
              isDryRun={isDryRun}
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
              isDryRun={isDryRun}
            />
            <RpcCreateTokenCard
              onExecute={getRpcCreateToken}
              disabled={isExecutingMethod || !isConnected}
              createTokenParams={createTokenParams}
              setCreateTokenParams={setCreateTokenParams}
              walletState={walletState}
              isDryRun={isDryRun}
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
              isDryRun={isDryRun}
            />
            <RpcBetCard
              onExecute={getRpcBet}
              disabled={isExecutingMethod || !isConnected}
              betParams={betParams}
              setBetParams={setBetParams}
              isDryRun={isDryRun}
            />
            <RpcSetBetResultCard
              onExecute={getRpcSetResult}
              disabled={isExecutingMethod || !isConnected}
              setResultParams={setBetResultParams}
              setSetResultParams={setSetBetResultParams}
              isDryRun={isDryRun}
            />
            <RpcWithdrawBetPrizeCard
              onExecute={getRpcWithdrawBetPrize}
              disabled={isExecutingMethod || !isConnected}
              withdrawBetPrizeParams={withdrawBetPrizeParams}
              setWithdrawBetPrizeParams={setWithdrawBetPrizeParams}
              isDryRun={isDryRun}
            />
          </div>
        </section>

        {/* Known Tokens Section */}
        <section>
          <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Token Management</h2>
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Known Tokens</h3>
                <p className="text-sm text-gray-400">See and remove remembered known tokens between sessions</p>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              {knownTokens.length === 0 ? (
                <div className="text-sm text-gray-400">No known tokens stored in localStorage.</div>
              ) : (
                knownTokens.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-gray-900/50 border border-gray-700 rounded p-2">
                    <div className="min-w-0">
                      <div className="text-sm font-mono text-gray-300 truncate">{t.symbol} — {t.name}</div>
                      <div className="text-xs font-mono text-gray-500 break-all flex items-center">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(t.id);
                            toast({ title: 'Copied', description: 'Token ID copied to clipboard' });
                          }}
                          className="text-gray-400 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mr-1"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        {t.id}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleRemoveKnownToken(t.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      </div>
    </>
  );
};
