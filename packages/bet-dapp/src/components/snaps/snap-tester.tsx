import React, { useEffect, useState } from 'react';
import { useRequestSnap, useInvokeSnap, useMetaMaskContext } from 'snap-utils';
import { SnapMethodCard } from './snap-method-card';
import { GetBalanceCard } from './get-balance-card';
import { SendTxCard, SendTxParams } from './send-tx-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, X, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { NetworkData, useWalletState } from '@/contexts/WalletStateContext';

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
  const { walletState, updateAddress, updateBalance, updateUtxos, updateNetwork, updateXpub, updateTransaction, clearWalletState } = useWalletState();
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
  const [expandedTxs, setExpandedTxs] = useState<Set<string>>(new Set());

  const isConnected = installedSnap !== null;
  const hasWalletData = walletState.addresses.size > 0 || walletState.balances.size > 0 || walletState.utxos.length > 0 || walletState.network !== null || walletState.xpub !== null || walletState.transactions.size > 0;

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
      try {
        const wrappedResult = await fn(...args);
	      console.log(`Result from wrapped function:`, wrappedResult);
				return wrappedResult;
      } catch (error) {
        console.error('Error caught in wrapper:', error);
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

  // Wallet Info Methods - getSnapNetwork defined first for lazy loading
  const getSnapNetwork = wrapWithErrorHandler(async () => {
    const result = await invokeSnap({ method: 'htr_getConnectedNetwork' });

    // Parse and store the network data
    if (result) {
      try {
        const parsed = JSON.parse(result as string);
        if (parsed.type === 4 && parsed.response) {
          const { network, genesisHash } = parsed.response;
          updateNetwork({ network, genesisHash });
        }
      } catch (e) {
        console.error('Failed to parse network response:', e);
      }
    }

    return result;
  });

	const getSnapAddress = wrapWithErrorHandler(async (addressIndex = 0) => {
    const result = await invokeSnap({
      method: 'htr_getAddress',
      params: { type: 'index', index: addressIndex }
    });

    // Parse and store the address data
    if (result) {
      try {
        const parsed = JSON.parse(result as string);
        if (parsed.type === 2 && parsed.response) {
          const { address, index, addressPath } = parsed.response;
          updateAddress({ address, index, addressPath });
        }
      } catch (e) {
        console.error('Failed to parse address response:', e);
      }
    }

    return result;
  });

  const getSnapBalance = wrapWithErrorHandler(async () => {
    // Filter out empty tokens
    const filteredTokens = balanceTokens.filter(token => token.trim() !== '');

    const result = await invokeSnap({
      method: 'htr_getBalance',
      params: {
        tokens: filteredTokens
      }
    });

    // Parse and store the balance data
    if (result) {
      try {
        const parsed = JSON.parse(result as string);
        if (parsed.type === 3 && Array.isArray(parsed.response)) {
          // Update each token balance in the context
          parsed.response.forEach((balanceItem: any) => {
            updateBalance({
              token: balanceItem.token,
              balance: balanceItem.balance,
              tokenAuthorities: balanceItem.tokenAuthorities,
              transactions: balanceItem.transactions,
              lockExpires: balanceItem.lockExpires,
            });
          });
        }
      } catch (e) {
        console.error('Failed to parse balance response:', e);
      }
    }

    return result;
  });

  const getSnapWalletInformation = wrapWithErrorHandler(async () => {
    const result = await invokeSnap({ method: 'htr_getWalletInformation' });

    // Parse and store the wallet information data
    if (result) {
      try {
        const parsed = JSON.parse(result as string);
        if (parsed.type === 12 && parsed.response) {
          const { network, address0 } = parsed.response;

          // Update network data
          if (network) {
            updateNetwork({ network, genesisHash: '' });
          }

          // Update address at index 0 (without path)
          if (address0) {
            updateAddress({ address: address0, index: 0 });
          }
        }
      } catch (e) {
        console.error('Failed to parse wallet information response:', e);
      }
    }

    return result;
  });

  const getSnapXpub = wrapWithErrorHandler(async () => {
    const result = await invokeSnap({ method: 'htr_getXpub' });

    // Parse and store the xpub data
    if (result) {
      try {
        const parsed = JSON.parse(result as string);
        if (parsed.type === 11 && parsed.response) {
          const { xpub } = parsed.response;
          if (xpub) {
            updateXpub({ xpub });
          }
        }
      } catch (e) {
        console.error('Failed to parse xpub response:', e);
      }
    }

    return result;
  });

  // Transaction Methods
  const getSnapUtxos = wrapWithErrorHandler(async () => {
    const result = await invokeSnap({ method: 'htr_getUtxos', params: {} });

    // Parse and store the UTXO data
    if (result) {
      try {
        const parsed = JSON.parse(result as string);
        if (parsed.type === 5 && parsed.response && Array.isArray(parsed.response.utxos)) {
          const utxos = parsed.response.utxos.map((utxo: any) => ({
            txId: utxo.tx_id,
            index: utxo.index,
            value: String(utxo.amount),
            token: '00', // Default to HTR token, update if token info is available
            address: utxo.address,
            locked: utxo.locked || false,
          }));
          updateUtxos(utxos);
        }
      } catch (e) {
        console.error('Failed to parse UTXOs response:', e);
      }
    }

    return result;
  });

  const getSnapUtxosAdvanced = wrapWithErrorHandler(async (inputValues?: Record<string, string>) => {
    // Build params object from input values, only including non-empty values
    const params: any = {};

    if (inputValues?.maxUtxos && inputValues.maxUtxos.trim()) {
      params.maxUtxos = parseInt(inputValues.maxUtxos, 10);
    }
    if (inputValues?.token && inputValues.token.trim()) {
      params.token = inputValues.token.trim();
    }
    if (inputValues?.filterAddress && inputValues.filterAddress.trim()) {
      params.filterAddress = inputValues.filterAddress.trim();
    }
    if (inputValues?.authorities && inputValues.authorities.trim()) {
      params.authorities = parseInt(inputValues.authorities, 10);
    }
    if (inputValues?.amountSmallerThan && inputValues.amountSmallerThan.trim()) {
      params.amountSmallerThan = parseInt(inputValues.amountSmallerThan, 10);
    }
    if (inputValues?.amountBiggerThan && inputValues.amountBiggerThan.trim()) {
      params.amountBiggerThan = parseInt(inputValues.amountBiggerThan, 10);
    }
    if (inputValues?.maximumAmount && inputValues.maximumAmount.trim()) {
      params.maximumAmount = parseInt(inputValues.maximumAmount, 10);
    }
    if (inputValues?.onlyAvailableUtxos && inputValues.onlyAvailableUtxos.trim()) {
      params.onlyAvailableUtxos = inputValues.onlyAvailableUtxos.toLowerCase() === 'true';
    }

    const result = await invokeSnap({ method: 'htr_getUtxos', params });

    // Parse and store the UTXO data
    if (result) {
      try {
        const parsed = JSON.parse(result as string);
        if (parsed.type === 5 && parsed.response && Array.isArray(parsed.response.utxos)) {
          const utxos = parsed.response.utxos.map((utxo: any) => ({
            txId: utxo.tx_id,
            index: utxo.index,
            value: String(utxo.amount),
            token: params.token ?? '00', // Default to HTR token, update if token info is available
            address: utxo.address,
            locked: utxo.locked || false,
          }));
          updateUtxos(utxos);
        }
      } catch (e) {
        console.error('Failed to parse UTXOs response:', e);
      }
    }

    return result;
  });

  const getSnapSendTx = wrapWithErrorHandler(async (params: SendTxParams) => {
    // Build the outputs array based on the params
    const outputs = params.outputs.map(output => {
      if (output.type === 'address') {
        const addressOutput: any = {
          address: output.address,
          value: output.value
        };
        if (output.token && output.token.trim()) {
          addressOutput.token = output.token;
        }
        return addressOutput;
      } else {
        const dataOutput: any = {
          data: output.data
        };
        if (output.dataType && output.dataType.trim()) {
          dataOutput.type = output.dataType;
        }
        return dataOutput;
      }
    });

    // Build the params object
    const invokeParams: any = { outputs };

    // Add inputs if provided
    if (params.inputs && params.inputs.length > 0) {
      invokeParams.inputs = params.inputs.map(input => ({
        txId: input.txId,
        index: parseInt(input.index, 10)
      }));
    }

    // Add change address if provided
    if (params.changeAddress && params.changeAddress.trim()) {
      invokeParams.changeAddress = params.changeAddress;
    }

    const result = await invokeSnap({
      method: 'htr_sendTransaction',
      params: invokeParams
    });

    // Parse and store the transaction data
    if (result) {
      try {
        const parsed = JSON.parse(result as string);
        if (parsed.type === 8 && parsed.response) {
          const txData = parsed.response;
          updateTransaction({
            hash: txData.hash,
            inputs: txData.inputs || [],
            outputs: txData.outputs || [],
            signalBits: txData.signalBits,
            version: txData.version,
            weight: txData.weight,
            nonce: txData.nonce,
            timestamp: txData.timestamp,
            parents: txData.parents || [],
            tokens: txData.tokens || [],
            headers: txData.headers || [],
            _dataToSignCache: txData._dataToSignCache,
          });
        }
      } catch (e) {
        console.error('Failed to parse transaction response:', e);
      }
    }

    return result;
  });

  const getSnapCreateToken = wrapWithErrorHandler(async () => {
    return await invokeSnap({
      method: 'htr_createToken',
      params: {
        name: 'test token',
        symbol: 'TST',
        amount: '100',
        address: 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N',
        change_address: 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK',
        create_mint: true,
        mint_authority_address: 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N',
        allow_external_mint_authority_address: true,
        create_melt: false,
        data: ['ab', 'c']
      }
    });
  });

  const getSnapSignWithAddress = wrapWithErrorHandler(async () => {
    return await invokeSnap({
      method: 'htr_signWithAddress',
      params: { message: 'test', addressIndex: 1 }
    });
  });

  // Nano Contract Methods
  const getSnapSendNano = wrapWithErrorHandler(async () => {
    return await invokeSnap({
      method: 'htr_sendNanoContractTx',
      params: {
        'nc_id': '00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490',
        method: 'bet',
        actions: [{ type: 'deposit', token: '00', amount: '1' }],
        args: ['WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N', '1x0']
      }
    });
  });

  const getSnapSendNanoCreateToken = wrapWithErrorHandler(async () => {
    return await invokeSnap({
      method: 'htr_createNanoContractCreateTokenTx',
      params: {
        method: 'initialize',
        createTokenOptions: {
          contract_pays_token_deposit: false,
          name: 'test token',
          symbol: 'TST',
          amount: '100',
          address: 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N',
          change_address: 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK',
          create_mint: true,
          mint_authority_address: 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N',
          allow_external_mint_authority_address: true,
          create_melt: true,
          data: ['ab', 'c']
        },
        data: {
          'blueprint_id': '000001291ad6218140ef41eef71f3c2fbeb000f6ddd592bc42c6cde9fa07a964',
          actions: [],
          args: ['76a914a3d942f602ea11b74c3b58d15531a35a80cab00388ac', '00', 1759997478]
        }
      }
    });
  });

  const getSnapSignOracleData = wrapWithErrorHandler(async () => {
    return await invokeSnap({
      method: 'htr_signOracleData',
      params: {
        nc_id: '00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490',
        data: '1x0',
        oracle: 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK'
      }
    });
  });

  // Settings Methods
	const getSnapChangeNetwork = wrapWithErrorHandler(async (newNetwork: 'testnet' | 'mainnet' = 'testnet') => {
    return await invokeSnap({
      method: 'htr_changeNetwork',
      params: { newNetwork: newNetwork }
    }).then((data) => {
	    const typedData = (JSON.parse(data as string) ?? {}) as { type: number; response: { newNetwork: string } };

			if (!typedData.response) {
				return; // No-op if the change wasn't successful
			}

	    clearWalletState();
	    const newData : NetworkData = {
				network: typedData.response.newNetwork,
				genesisHash: '',
				lastUpdated: Date.now(),
			};
	    updateNetwork(newData)
    });
  });

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
      {hasWalletData && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-hathor-yellow-500">Stored Wallet Data</h2>
            <Button
              onClick={clearWalletState}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
            >
              Clear All Data
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Addresses */}
            {walletState.addresses.size > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">Addresses</h3>
                <div className="space-y-3">
                  {Array.from(walletState.addresses.values()).map((addressData) => (
                    <div
                      key={addressData.index}
                      className="bg-gray-900/50 border border-gray-700 rounded p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Index:</span>
                          <span className="text-sm font-mono text-gray-300">{addressData.index}</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-gray-400 flex-shrink-0">Address:</span>
	                        <div className="flex items-start gap-1.5 min-w-0">
		                        <button
			                        onClick={() => navigator.clipboard.writeText(addressData.address)}
			                        className="text-gray-400 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
			                        title="Copy to clipboard"
		                        >
			                        <Copy className="h-3 w-3" />
		                        </button>
		                        <span className="text-sm font-mono text-gray-300 break-all text-right">
	                            {addressData.address}
	                          </span>
	                        </div>
                        </div>
                        {addressData.addressPath && (
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm text-gray-400 flex-shrink-0">Path:</span>
                            <span className="text-xs font-mono text-gray-500 break-all text-right">
                              {addressData.addressPath}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                          <span className="text-xs text-gray-500">Last updated:</span>
                          <span className="text-xs text-gray-500">
                            {new Date(addressData.lastUpdated).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Balances */}
            {walletState.balances.size > 0 && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">Balances</h3>
                <div className="space-y-3">
                  {Array.from(walletState.balances.values()).map((balanceData) => (
                    <div
                      key={balanceData.token.id}
                      className="bg-gray-900/50 border border-gray-700 rounded p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-gray-400 flex-shrink-0">Token:</span>
                          <span className="text-sm font-mono text-gray-300 break-all text-right">
                            {balanceData.token.symbol} ({balanceData.token.name})
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">Token ID:</span>
	                        <div className="flex items-start gap-1.5 min-w-0">
		                        <button
			                        onClick={() => navigator.clipboard.writeText(balanceData.token.id)}
			                        className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
			                        title="Copy to clipboard"
		                        >
			                        <Copy className="h-3 w-3" />
		                        </button>
		                        <span className="text-xs font-mono text-gray-500 break-all text-right">
	                            {balanceData.token.id}
	                          </span>
	                        </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Unlocked:</span>
                          <span className="text-sm font-mono text-green-400">{balanceData.balance.unlocked}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Locked:</span>
                          <span className="text-sm font-mono text-orange-400">{balanceData.balance.locked}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Transactions:</span>
                          <span className="text-sm font-mono text-gray-300">{balanceData.transactions}</span>
                        </div>
                        {(balanceData.tokenAuthorities.unlocked.mint || balanceData.tokenAuthorities.unlocked.melt) && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Authorities:</span>
                            <span className="text-xs font-mono text-blue-400">
                              {balanceData.tokenAuthorities.unlocked.mint && 'MINT '}
                              {balanceData.tokenAuthorities.unlocked.melt && 'MELT'}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                          <span className="text-xs text-gray-500">Last updated:</span>
                          <span className="text-xs text-gray-500">
                            {new Date(balanceData.lastUpdated).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Network */}
            {walletState.network && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">Network</h3>
                <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Current Network:</span>
                      <span className="text-sm font-semibold text-hathor-yellow-400">
                        {walletState.network.network}
                      </span>
                    </div>
                    {walletState.network.genesisHash && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs text-gray-500 flex-shrink-0">Genesis Hash:</span>
                        <span className="text-xs font-mono text-gray-500 break-all text-right">
                          {walletState.network.genesisHash}
                        </span>
                      </div>
                    )}
                    {walletState.network.network !== 'testnet' && (
                      <div className="pt-2 border-t border-gray-700/50">
                        <Button
                          onClick={() => getSnapChangeNetwork()}
                          disabled={isExecutingMethod}
                          size="sm"
                          variant="outline"
                          className="w-full border-hathor-yellow-500/50 text-hathor-yellow-400 hover:bg-hathor-yellow-500/10 hover:text-hathor-yellow-300"
                        >
                          Switch to Testnet
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                      <span className="text-xs text-gray-500">Last updated:</span>
                      <span className="text-xs text-gray-500">
                        {new Date(walletState.network.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Xpub */}
            {walletState.xpub && (
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">Extended Public Key</h3>
                <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-400 flex-shrink-0">Xpub:</span>
                      <div className="flex items-start gap-1.5 min-w-0">
                        <button
                          onClick={() => navigator.clipboard.writeText(walletState.xpub!.xpub)}
                          className="text-gray-400 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-mono text-gray-300 break-all text-right">
                          {walletState.xpub.xpub}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                      <span className="text-xs text-gray-500">Last updated:</span>
                      <span className="text-xs text-gray-500">
                        {new Date(walletState.xpub.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* UTXOs */}
            {walletState.utxos.length > 0 && (
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">
                  UTXOs ({walletState.utxos.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {walletState.utxos.map((utxo, idx) => (
                    <div
                      key={`${utxo.txId}-${utxo.index}-${idx}`}
                      className="bg-gray-900/50 border border-gray-700 rounded p-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-gray-400 flex-shrink-0">TX ID:</span>
	                        <div className="flex items-start gap-1.5 min-w-0">
		                        <button
			                        onClick={() => navigator.clipboard.writeText(utxo.txId)}
			                        className="text-gray-300 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
			                        title="Copy to clipboard"
		                        >
			                        <Copy className="h-3 w-3" />
		                        </button>
		                        <span className="text-xs font-mono text-gray-300 break-all text-right">
	                            {utxo.txId}
	                          </span>
	                        </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Index:</span>
                          <span className="text-sm font-mono text-gray-300">{utxo.index}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Value:</span>
                          <span className={`text-sm font-mono ${utxo.locked ? 'text-orange-400' : 'text-green-400'}`}>{utxo.value}{utxo.locked && ' (Locked)'}</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-gray-400 flex-shrink-0">Token:</span>
                          {(() => {
                            const tokenInfo = getTokenInfo(utxo.token);
                            if (tokenInfo) {
                              // Nice display: Symbol (Name)
                              return (
                                <span className="text-sm font-mono text-gray-300 break-all text-right">
                                  {tokenInfo.symbol} ({tokenInfo.name})
                                </span>
                              );
                            } else {
                              // Fallback: Raw token ID with copy button
                              return (
                                <div className="flex items-start gap-1.5 min-w-0">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(utxo.token)}
                                    className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
                                    title="Copy to clipboard"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                  <span className="text-xs font-mono text-gray-500 break-all text-right">
                                    {utxo.token}
                                  </span>
                                </div>
                              );
                            }
                          })()}
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm text-gray-400 flex-shrink-0">Address:</span>
	                        <div className="flex items-start gap-1.5 min-w-0">
		                        <button
			                        onClick={() => navigator.clipboard.writeText(utxo.address)}
			                        className="text-gray-400 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
			                        title="Copy to clipboard"
		                        >
			                        <Copy className="h-3 w-3" />
		                        </button>
		                        <span className="text-xs font-mono text-gray-500 break-all text-right">
	                            {utxo.address}
	                          </span>
	                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Transactions */}
            {walletState.transactions.size > 0 && (
              <Card className="p-4 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">
                  Transactions ({walletState.transactions.size})
                </h3>
                <div className="space-y-3">
                  {Array.from(walletState.transactions.values()).map((tx) => {
                    const isExpanded = expandedTxs.has(tx.hash);
                    return (
                      <div
                        key={tx.hash}
                        className="bg-gray-900/50 border border-gray-700 rounded"
                      >
                        {/* Compact Header */}
                        <div
                          className="p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
                          onClick={() => toggleTxExpansion(tx.hash)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              )}
                              <span className="text-sm text-gray-400 flex-shrink-0">TX:</span>
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(tx.hash);
                                  }}
                                  className="text-gray-300 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
                                  title="Copy to clipboard"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                                <span className="text-xs font-mono text-gray-300 break-all">
                                  {tx.hash}
                                </span>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {new Date(tx.timestamp * 1000).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="border-t border-gray-700 p-3 space-y-3">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Version:</span>
                                <span className="text-gray-300 font-mono">{tx.version}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Weight:</span>
                                <span className="text-gray-300 font-mono">{tx.weight.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Nonce:</span>
                                <span className="text-gray-300 font-mono">{tx.nonce}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Signal Bits:</span>
                                <span className="text-gray-300 font-mono">{tx.signalBits}</span>
                              </div>
                            </div>

                            {/* Parents */}
                            {tx.parents.length > 0 && (
                              <div>
                                <div className="text-sm text-gray-400 mb-1">Parents:</div>
                                <div className="space-y-1">
                                  {tx.parents.map((parent, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => navigator.clipboard.writeText(parent)}
                                        className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
                                        title="Copy to clipboard"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </button>
                                      <span className="text-xs font-mono text-gray-500 break-all">
                                        {parent}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Inputs */}
                            {tx.inputs.length > 0 && (
                              <div>
                                <div className="text-sm text-gray-400 mb-1">
                                  Inputs ({tx.inputs.length}):
                                </div>
                                <div className="space-y-2">
                                  {tx.inputs.map((input, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-gray-800/50 rounded p-2 space-y-1"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-gray-500">Hash:</span>
                                        <button
                                          onClick={() => navigator.clipboard.writeText(input.hash)}
                                          className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
                                          title="Copy to clipboard"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </button>
                                        <span className="text-xs font-mono text-gray-400 break-all">
                                          {input.hash}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Index: <span className="text-gray-400">{input.index}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Outputs */}
                            {tx.outputs.length > 0 && (
                              <div>
                                <div className="text-sm text-gray-400 mb-1">
                                  Outputs ({tx.outputs.length}):
                                </div>
                                <div className="space-y-2">
                                  {tx.outputs.map((output, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-gray-800/50 rounded p-2 space-y-1"
                                    >
                                      <div className="text-xs text-gray-500">
                                        Value: <span className="text-green-400 font-mono">{output.value}</span>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Token Data: <span className="text-gray-400">{output.tokenData}</span>
                                      </div>
                                      {output.decodedScript && (
                                        <div className="text-xs text-gray-500">
                                          Script: <span className="text-gray-400">{output.decodedScript}</span>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Tokens */}
                            {tx.tokens.length > 0 && (
                              <div>
                                <div className="text-sm text-gray-400 mb-1">
                                  Tokens ({tx.tokens.length}):
                                </div>
                                <div className="text-xs font-mono text-gray-500">
                                  {JSON.stringify(tx.tokens, null, 2)}
                                </div>
                              </div>
                            )}

                            {/* Last Updated */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                              <span className="text-xs text-gray-500">Last updated:</span>
                              <span className="text-xs text-gray-500">
                                {new Date(tx.lastUpdated).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </section>
      )}

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
          <SnapMethodCard
            title="Get Xpub"
            description="Retrieve the extended public key (xpub)"
            onExecute={getSnapXpub}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
          />
        </div>
      </section>

	    {/* UTXO Section */}
	    <section>
		    <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">UTXOs</h2>
		    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			    <SnapMethodCard
				    title="Get UTXOs"
				    description="Retrieve unspent transaction outputs"
				    onExecute={getSnapUtxos}
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
          <SendTxCard
            onExecute={getSnapSendTx}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
            sendTxParams={sendTxParams}
            setSendTxParams={setSendTxParams}
            walletState={walletState}
          />
          <SnapMethodCard
            title="Create Token"
            description="Create a new custom token (TST)"
            onExecute={getSnapCreateToken}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
          />
          <SnapMethodCard
            title="Sign with Address"
            description="Sign a message using address index 1"
            onExecute={getSnapSignWithAddress}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
          />
        </div>
      </section>

      {/* Nano Contracts Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Nano Contracts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SnapMethodCard
            title="Send Nano TX"
            description="Execute a bet nano contract transaction"
            onExecute={getSnapSendNano}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
          />
          <SnapMethodCard
            title="Create Nano + Token"
            description="Initialize nano contract with token creation"
            onExecute={getSnapSendNanoCreateToken}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
          />
          <SnapMethodCard
            title="Sign Oracle Data"
            description="Sign oracle data for nano contract"
            onExecute={getSnapSignOracleData}
            onError={handleGlobalError}
            disabled={isExecutingMethod}
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
