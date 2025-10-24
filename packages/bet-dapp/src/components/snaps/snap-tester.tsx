import React, { useEffect, useState, useRef } from 'react';
import { useRequestSnap, useInvokeSnap, useMetaMaskContext } from 'snap-utils';
import { SnapMethodCard } from './snap-method-card';
import { GetBalanceCard } from './get-balance-card';
import { GetUtxosCard } from './get-utxos-card';
import { SendTxCard, SendTxParams } from './send-tx-card';
import { CreateTokenCard, CreateTokenParams } from './create-token-card';
import { SignWithAddressCard } from './sign-with-address-card';
import { SignOracleDataCard } from './sign-oracle-data-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, X } from 'lucide-react';
import { useWalletState, UtxoData } from '@/contexts/WalletStateContext';
import { createSnapHandlers } from './snap-method-handlers';
import { StateVisualizer } from './state-visualizer';
import { SendNanoCard } from './send-nano-card';
import { SendNanoCreateTokenCard } from './send-nano-create-token-card';
import { InitializeBetCard } from './initialize-bet-card';
import { BetCard } from './bet-card';
import { SetBetResultCard } from './set-bet-result-card';
import { WithdrawBetPrizeCard } from './withdraw-bet-prize-card';
import type { SendNanoParams, SendNanoCreateTokenParams, InitializeBetParams, BetParams, SetResultParams, WithdrawBetPrizeParams } from './snap-method-handlers';
import { TESTNET_INDIA_BET_BLUEPRINT_ID } from '@/components/snaps/constants'

interface SnapError {
  id: string;
  code?: number;
  message: string;
  details?: string;
  timestamp: number;
}

/**
 * Hardcoded snap ID for local development.
 * Change if needed.
 */
const snapId = 'local:http://localhost:8080';

export const SnapTester: React.FC = () => {
  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();
  const { installedSnap, setInstalledSnap, error: contextError, setError: setContextError } = useMetaMaskContext();
  const { walletState, updateAddress, updateBalance, updateUtxos, updateNetwork, updateXpub, updateBlueprint, updateBetNanoContract, updateTransaction, clearUtxos, clearWalletState } = useWalletState();
  const [globalErrors, setGlobalErrors] = useState<SnapError[]>([]);
  const [isExecutingMethod, setIsExecutingMethod] = useState<boolean>(false);
  const [balanceTokens, setBalanceTokens] = useState<string[]>(['00']);
  const [sendTxParams, setSendTxParams] = useState<SendTxParams>({
    outputs: [
      { type: 'address', address: '', value: '1', token: '' },
    ],
    inputs: [],
    changeAddress: ''
  });
  const [createTokenParams, setCreateTokenParams] = useState<CreateTokenParams>({
    name: 'Test Token',
    symbol: 'TST',
    amount: '100',
    address: '',
    change_address: '',
    create_mint: true,
    mint_authority_address: '',
    allow_external_mint_authority_address: false,
    create_melt: true,
    melt_authority_address: '',
    allow_external_melt_authority_address: false,
    push_tx: false,
    data: []
  });
  const [expandedTxs, setExpandedTxs] = useState<Set<string>>(new Set());
  const [loadingTokenUtxos, setLoadingTokenUtxos] = useState<Set<string>>(new Set());
  const sendTxCardRef = useRef<HTMLDivElement>(null);

  // New state for Send Nano TX params
  const [sendNanoParams, setSendNanoParams] = useState<SendNanoParams>({
    method: 'bet',
    nc_id: '00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490',
    actions: [{ type: 'deposit', token: '00', amount: '1' }],
    args: ['WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N', '1x0'],
    push_tx: false,
  });

  // New state for Create Nano + Token params
  const [sendNanoCreateTokenParams, setSendNanoCreateTokenParams] = useState<SendNanoCreateTokenParams>({
    method: 'initialize',
    address: '',
    data: '',
    createTokenOptions: '',
    options: '',
    push_tx: false,
  });

  // New state for Create Bet params
  const [initializeBetParams, setInitializeBetParams] = useState<InitializeBetParams>({
    blueprintId: TESTNET_INDIA_BET_BLUEPRINT_ID,
    oracleAddress: '',
    token: '00',
    deadline: new Date(Date.now() + 3600 * 1000), // 1 hour from now
    push_tx: false,
  });

  // New state for Bet params
  const [betParams, setBetParams] = useState<BetParams>({
    ncId: '',
    betChoice: '1x0',
    amount: 1,
    address: '',
    token: '00',
    push_tx: false,
  });

  // New state for Set Result params
  const [setBetResultParams, setSetBetResultParams] = useState<SetResultParams>({
    ncId: '',
    oracle: '',
    result: '1x0',
    push_tx: false,
  });

  // New state for Withdraw Bet Prize params
  const [withdrawBetPrizeParams, setWithdrawBetPrizeParams] = useState<WithdrawBetPrizeParams>({
    ncId: '',
    address: '',
    amount: 100,
    token: '00',
    push_tx: false,
  });

  const isConnected = installedSnap !== null;

  // Check if snap is already installed on mount
  useEffect(() => {
    const checkSnapInstalled = async () => {
      if (!installedSnap) {
	      console.log(`Checking if snap is already installed...`);
        try {
          // Use wallet_getSnaps to check if snap is already installed
          const snaps = await (window as any).ethereum?.request({
            method: 'wallet_getSnaps',
          });
	        console.log(`Retrieved installed snaps:`, snaps);

          // Check if our snap is in the list
          if (snaps && snaps[snapId]) {
            setInstalledSnap(snaps[snapId]);
            console.log('Snap already installed:', snaps[snapId]);
          }
        } catch (error) {
          console.log('Could not check installed snaps:', error);
        }
      }
    };

	  checkSnapInstalled().catch(err => console.error('Error checking snap installation:', err));
  }, [installedSnap, setInstalledSnap]);

  // Watch for errors from MetaMask context (from useRequest hook)
  useEffect(() => {
    if (contextError) {
      console.warn('Context error detected:', contextError);
      handleGlobalError(contextError);
      // Clear the context error after handling it
      setContextError(null);
    }
  }, [contextError, setContextError]);

  // Lazy-load Wallet Information data on component mount if not already loaded
  useEffect(() => {
    if (isConnected && !walletState.network) {
      (async () => {
        try {
          await getSnapWalletInformation();
        } catch (error) {
          console.error('Failed to lazy-load network data:', error);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, walletState.network]);

  // MetaMask detection logic
  useEffect(() => {
    const handleProvider = (event: any) => {
      const providerDetail = event.detail;

      if (providerDetail.info.rdns === "io.metamask") {
        console.log("MetaMask successfully detected!");
      } else if (providerDetail.info.rdns === "io.metamask.flask") {
        console.log("MetaMask Flask successfully detected!");
      } else {
        console.error("Please install MetaMask Flask!");
      }
    };

    window.addEventListener("eip6963:announceProvider", handleProvider);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", handleProvider);
    };
  }, []);

  // Global error handler
  const handleGlobalError = (error: any) => {
    const errorId = `${Date.now()}-${Math.random()}`;

    let message = 'An unknown error occurred';
    let code: number | undefined;
    let details: string | undefined;

    if (error && typeof error === 'object') {
      // Handle Snap errors with code and data
      if (error.code !== undefined) {
        code = error.code;
        message = error.message || 'Snap Error';

        // Extract additional details from error.data
        if (error.data) {
          if (error.data.cause) {
            const cause = error.data.cause;
            if (cause.message) {
              details = cause.message;
            }
            if (cause.errorCode) {
              details = details ? `${details} (${cause.errorCode})` : cause.errorCode;
            }
          }
          if (error.data.snapId) {
            details = details ? `${details}\nSnap: ${error.data.snapId}` : `Snap: ${error.data.snapId}`;
          }
        }
      } else if (error.message) {
        message = error.message;
      }

      // Check for stack trace
      if (error.stack) {
        details = details ? `${details}\n\nStack:\n${error.stack}` : `Stack:\n${error.stack}`;
      }
    } else if (typeof error === 'string') {
      message = error;
    }

    const snapError: SnapError = {
      id: errorId,
      code,
      message,
      details,
      timestamp: Date.now(),
    };

    setGlobalErrors((prev) => [...prev, snapError]);
  };

  // Wrap snap methods with global error handler
  const wrapWithErrorHandler = <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      setIsExecutingMethod(true);
	    const wrapperName = fn?.name || 'anonymous'
	    try {
        const wrappedResult = await fn(...args);
	      console.log(`Result from wrapped function: `, { wrapperName, args, result: wrappedResult });
				return wrappedResult;
      } catch (error) {
        console.error(`Error caught in wrapper function: `, { wrapperName, args, error });
        handleGlobalError(error);
        throw error;
      } finally {
        setIsExecutingMethod(false);
      }
    };
  };

  const dismissError = (errorId: string) => {
    setGlobalErrors((prev) => prev.filter((err) => err.id !== errorId));
  };

	// Create snap handlers
	const snapHandlers = createSnapHandlers({
		invokeSnap,
		updateAddress,
		updateBalance,
		updateUtxos,
		updateNetwork,
		updateXpub,
		updateBetNanoContract,
		updateTransaction,
		clearWalletState,
		balanceTokens,
	});

	// Wrap handlers with error handling
	const getSnapNetwork = wrapWithErrorHandler(snapHandlers.getSnapNetwork);
	const getSnapAddress = wrapWithErrorHandler(snapHandlers.getSnapAddress);
	const getSnapBalance = wrapWithErrorHandler(snapHandlers.getSnapBalance);
  const getSnapWalletInformation = wrapWithErrorHandler(snapHandlers.getSnapWalletInformation);
  const getSnapXpub = wrapWithErrorHandler(snapHandlers.getSnapXpub);
  const getSnapUtxosSimple = wrapWithErrorHandler(snapHandlers.getSnapUtxosSimple);
  const getSnapUtxosAdvanced = wrapWithErrorHandler(snapHandlers.getSnapUtxosAdvanced);
  const getSnapSendTx = wrapWithErrorHandler(snapHandlers.getSnapSendTx);
  const getSnapCreateToken = wrapWithErrorHandler(snapHandlers.getSnapCreateToken);
  const getSnapSignWithAddress = wrapWithErrorHandler(snapHandlers.getSnapSignWithAddress);
  const getSnapSendNano = wrapWithErrorHandler(snapHandlers.getSnapSendNano);
  const getSnapSendNanoCreateToken = wrapWithErrorHandler(snapHandlers.getSnapSendNanoCreateToken);
  const getSnapCreateBet = wrapWithErrorHandler(snapHandlers.getSnapCreateBet);
  const getSnapBet = wrapWithErrorHandler(snapHandlers.getSnapBet);
  const getSnapSetResult = wrapWithErrorHandler(snapHandlers.getSnapSetResult);
  const getSnapWithdrawBetPrize = wrapWithErrorHandler(snapHandlers.getSnapWithdrawBetPrize);
  const getSnapSignOracleData = wrapWithErrorHandler(snapHandlers.getSnapSignOracleData);
	const getSnapChangeNetwork = wrapWithErrorHandler(snapHandlers.getSnapChangeNetwork);

  /**
   * Helper function to get token information from balances.
   * Returns token info if found in wallet state, otherwise null.
   * Used for graceful degradation when displaying token information.
   */
  const getTokenInfo = (tokenId: string): { id: string; symbol: string; name: string } | null => {
    const balanceData = walletState.balances.get(tokenId);
    return balanceData ? balanceData.token : null;
  };

  /**
   * Helper function to toggle transaction expansion
   */
  const toggleTxExpansion = (txHash: string) => {
    setExpandedTxs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(txHash)) {
        newSet.delete(txHash);
      } else {
        newSet.add(txHash);
      }
      return newSet;
    });
  };

  /**
   * Helper function to fetch UTXOs for a specific token
   */
  const handleFetchUtxosForToken = async (tokenId: string) => {
    setLoadingTokenUtxos(prev => {
      const newSet = new Set(prev);
      newSet.add(tokenId);
      return newSet;
    });

    try {
      await getSnapUtxosSimple(tokenId);
    } catch (error) {
      console.error('Failed to fetch UTXOs for token:', error);
    } finally {
      setLoadingTokenUtxos(prev => {
        const newSet = new Set(prev);
        newSet.delete(tokenId);
        return newSet;
      });
    }
  };

  /**
   * Helper function to use a specific UTXO as input for send transaction
   */
  const handleUseUtxoAsInput = (utxo: UtxoData) => {
    // Try to find a different address than the UTXO's address
    let targetAddress = utxo.address;
    const addresses = Array.from(walletState.addresses.values());
    const differentAddress = addresses.find(addr => addr.address !== utxo.address);
    if (differentAddress) {
      targetAddress = differentAddress.address;
    }

    // Build the new params
    const newParams: SendTxParams = {
      outputs: [
        {
          type: 'address',
          address: targetAddress,
          value: utxo.value,
          token: utxo.token === '00' ? '' : utxo.token, // Empty string for HTR, otherwise use token
        },
      ],
      inputs: [
        {
          txId: utxo.txId,
          index: String(utxo.index),
        },
      ],
      changeAddress: '',
    };

    setSendTxParams(newParams);

    // Scroll to the send transaction card
    if (sendTxCardRef.current) {
      sendTxCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Error Display */}
      {globalErrors.length > 0 && (
        <div className="space-y-3">
          {globalErrors.map((error) => (
            <div
              key={error.id}
              className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-red-400 font-semibold text-sm break-words">
                      {error.message}
                      {error.code !== undefined && (
                        <span className="ml-2 text-red-500/70 font-mono">
                          (Code: {error.code})
                        </span>
                      )}
                    </h3>
                  </div>
                  <button
                    onClick={() => dismissError(error.id)}
                    className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                    aria-label="Dismiss error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {error.details && (
                  <p className="text-sm text-red-300/80 whitespace-pre-wrap break-words">
                    {error.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Snap Section */}
      {!isConnected && (
        <Card className="p-6 bg-hathor-yellow-500/10 border-hathor-yellow-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Connect to Hathor Snap</h2>
              <p className="text-gray-400">
                First, connect to the Hathor MetaMask Snap to enable testing
              </p>
            </div>
            <Button
              onClick={requestSnap}
              size="lg"
              className="bg-hathor-yellow-500 hover:bg-hathor-yellow-600 text-black font-semibold"
            >
              Connect Snap
            </Button>
          </div>
        </Card>
      )}

      {/* Wallet Context Data Display */}
	    <StateVisualizer
		    walletState={walletState}
		    clearWalletState={clearWalletState}
		    clearUtxos={clearUtxos}
		    handleFetchUtxosForToken={handleFetchUtxosForToken}
		    handleUseUtxoAsInput={handleUseUtxoAsInput}
		    handleGetXpub={getSnapXpub}
		    getTokenInfo={getTokenInfo}
		    expandedTxs={expandedTxs}
		    toggleTxExpansion={toggleTxExpansion}
		    loadingTokenUtxos={loadingTokenUtxos}
		    isExecutingMethod={isExecutingMethod}
		    getSnapChangeNetwork={getSnapChangeNetwork}
		    getSnapAddress={getSnapAddress}
	    />


	    {/* Wallet Info Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Wallet Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SnapMethodCard
            title="Get Address"
            description="Retrieve the wallet address at a specific index"
            onExecute={async (inputValues) => {
              const addressIndex = inputValues?.addressIndex ? parseInt(inputValues.addressIndex, 10) : 0;
              return await getSnapAddress(addressIndex);
            }}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            inputs={[
              {
                name: 'addressIndex',
                label: 'Address Index',
                defaultValue: '1',
                placeholder: 'Enter address index (e.g., 0, 1, 2...)'
              }
            ]}
          />
	        <SnapMethodCard
		        title="Get Xpub"
		        description="Retrieve the extended public key (xpub)"
		        onExecute={getSnapXpub}
		        onError={handleGlobalError}
		        disabled={isExecutingMethod}
	        />
          <GetBalanceCard
            onExecute={getSnapBalance}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            balanceTokens={balanceTokens}
            setBalanceTokens={setBalanceTokens}
          />
          <SnapMethodCard
            title="Get Network"
            description="Get the currently connected network (does not require confirmation)"
            onExecute={getSnapNetwork}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
          />
          <SnapMethodCard
            title="Get Wallet Information"
            description="Retrieve Network and Address 0 simultaneously (does not require confirmation)"
            onExecute={getSnapWalletInformation}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
          />
        </div>
      </section>

	    {/* Signatures Section */}
	    <section>
		    <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Signatures</h2>
		    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			    <SignWithAddressCard
				    onExecute={getSnapSignWithAddress}
				    onError={handleGlobalError}
				    disabled={isExecutingMethod}
				    walletState={walletState}
			    />
			    <SignOracleDataCard
				    onExecute={getSnapSignOracleData}
				    onError={handleGlobalError}
				    disabled={isExecutingMethod}
				    walletState={walletState}
			    />
		    </div>
	    </section>

	    <hr className="border-t border-gray-700/50 my-4" />

	    {/* UTXO Section */}
	    <section>
		    <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">UTXOs</h2>
		    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			    <GetUtxosCard
				    onExecute={getSnapUtxosSimple}
				    onError={handleGlobalError}
				    disabled={isExecutingMethod}
			    />
			    <SnapMethodCard
				    title="Get UTXOs (Advanced)"
				    description="Retrieve UTXOs with advanced filtering options"
				    onExecute={getSnapUtxosAdvanced}
				    onError={handleGlobalError}
				    disabled={isExecutingMethod}
				    inputs={[
					    {
						    name: 'maxUtxos',
						    label: 'Max UTXOs',
						    defaultValue: '',
						    placeholder: 'Maximum number of UTXOs to return'
					    },
					    {
						    name: 'token',
						    label: 'Token ID',
						    defaultValue: '',
						    placeholder: 'Filter by token (e.g., 00 for HTR)'
					    },
					    {
						    name: 'filterAddress',
						    label: 'Address',
						    defaultValue: '',
						    placeholder: 'Filter by specific address'
					    },
					    {
						    name: 'authorities',
						    label: 'Authorities',
						    defaultValue: '',
						    placeholder: 'Filter by authority mask (number)'
					    },
					    {
						    name: 'amountSmallerThan',
						    label: 'Amount <',
						    defaultValue: '',
						    placeholder: 'Maximum amount per UTXO'
					    },
					    {
						    name: 'amountBiggerThan',
						    label: 'Amount >',
						    defaultValue: '',
						    placeholder: 'Minimum amount per UTXO'
					    },
					    {
						    name: 'maximumAmount',
						    label: 'Total Max Amount',
						    defaultValue: '',
						    placeholder: 'Maximum total amount'
					    },
					    {
						    name: 'onlyAvailableUtxos',
						    label: 'Available Only',
						    defaultValue: '',
						    placeholder: 'true or false'
					    }
				    ]}
			    />
		    </div>
	    </section>

      {/* Transaction Section */}
      <section>
	      <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Transactions</h2>
	      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div ref={sendTxCardRef}>
            <SendTxCard
              onExecute={getSnapSendTx}
              onError={handleGlobalError}
              disabled={isExecutingMethod}
              sendTxParams={sendTxParams}
              setSendTxParams={setSendTxParams}
              walletState={walletState}
            />
          </div>
          <CreateTokenCard
            onExecute={getSnapCreateToken}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            createTokenParams={createTokenParams}
            setCreateTokenParams={setCreateTokenParams}
            walletState={walletState}
          />
        </div>
      </section>

      {/* Nano Contracts Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Test Bet Blueprint</h2>

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
          <InitializeBetCard
            onExecute={getSnapCreateBet}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            createBetParams={initializeBetParams}
            setCreateBetParams={setInitializeBetParams}
          />
          <BetCard
            onExecute={getSnapBet}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            betParams={betParams}
            setBetParams={setBetParams}
          />
          <SetBetResultCard
            onExecute={getSnapSetResult}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            setResultParams={setBetResultParams}
            setSetResultParams={setSetBetResultParams}
          />
          <WithdrawBetPrizeCard
            onExecute={getSnapWithdrawBetPrize}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            withdrawBetPrizeParams={withdrawBetPrizeParams}
            setWithdrawBetPrizeParams={setWithdrawBetPrizeParams}
          />
        </div>
      </section>

      {/* Test Bet Blueprint Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Nano Contracts (Generic)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SendNanoCard
            onExecute={getSnapSendNano}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            sendNanoParams={sendNanoParams}
            setSendNanoParams={setSendNanoParams}
          />
          <SendNanoCreateTokenCard
            onExecute={getSnapSendNanoCreateToken}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            sendNanoCreateTokenParams={sendNanoCreateTokenParams}
            setSendNanoCreateTokenParams={setSendNanoCreateTokenParams}
          />
        </div>
      </section>

      {/* Settings Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SnapMethodCard
            title="Change Network"
            description="Switch between Hathor networks"
            onError={handleGlobalError}
            actionButtons={[
              {
                label: 'Testnet',
                onExecute: () => getSnapChangeNetwork('testnet'),
                disabled: isExecutingMethod || walletState.network?.network === 'testnet',
                className: "flex-1 bg-hathor-yellow-500 hover:bg-hathor-yellow-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              },
              {
                label: 'Mainnet',
                onExecute: () => getSnapChangeNetwork('mainnet'),
                disabled: isExecutingMethod || walletState.network?.network === 'mainnet',
                className: "flex-1 bg-hathor-yellow-500 hover:bg-hathor-yellow-600 text-black font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              }
            ]}
          />
        </div>
      </section>
    </div>
  );
};
