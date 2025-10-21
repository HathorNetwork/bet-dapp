import React, { useEffect, useState } from 'react';
import { useRequestSnap, useInvokeSnap, useMetaMaskContext } from 'snap-utils';
import { SnapMethodCard } from './snap-method-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, X, CheckCircle2, Unplug } from 'lucide-react';
import { useWalletState } from '@/contexts/WalletStateContext';

interface SnapError {
  id: string;
  code?: number;
  message: string;
  details?: string;
  timestamp: number;
}

export const SnapTester: React.FC = () => {
  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();
  const { installedSnap, setInstalledSnap, error: contextError, setError: setContextError } = useMetaMaskContext();
  const { updateAddress, updateBalance, updateUtxos, updateNetwork } = useWalletState();
  const [globalErrors, setGlobalErrors] = useState<SnapError[]>([]);

  const isConnected = installedSnap !== null;

  // Watch for errors from MetaMask context (from useRequest hook)
  useEffect(() => {
    if (contextError) {
      console.log('Context error detected:', contextError);
      handleGlobalError(contextError);
      // Clear the context error after handling it
      setContextError(null);
    }
  }, [contextError]);

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

    console.log('Created snap error:', snapError);
    setGlobalErrors((prev) => [...prev, snapError]);
  };

  // Wrap snap methods with global error handler
  const wrapWithErrorHandler = <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      try {
        const wrappedResult = await fn(...args);
	      console.log(`Result from wrapped function:`, wrappedResult);
				return wrappedResult;
      } catch (error) {
        console.log('Error caught in wrapper:', error);
        handleGlobalError(error);
        throw error;
      }
    };
  };

  const dismissError = (errorId: string) => {
    setGlobalErrors((prev) => prev.filter((err) => err.id !== errorId));
  };

  // Wallet Info Methods
  const getSnapAddress = wrapWithErrorHandler(async () => {
    const result = await invokeSnap({
      method: 'htr_getAddress',
      params: { type: 'index', index: 0 }
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
    return await invokeSnap({
      method: 'htr_getBalance',
      params: {
        tokens: ['00', '00000337f9db18c355a376697f64fd6e36945fc984d6569b4b0d86e2af185945']
      }
    });
  });

  const getSnapNetwork = wrapWithErrorHandler(async () => {
    return await invokeSnap({ method: 'htr_getConnectedNetwork' });
  });

  // Transaction Methods
  const getSnapUtxos = wrapWithErrorHandler(async () => {
    return await invokeSnap({ method: 'htr_getUtxos', params: {} });
  });

  const getSnapSendTx = wrapWithErrorHandler(async () => {
    return await invokeSnap({
      method: 'htr_sendTransaction',
      params: {
        outputs: [
          { address: 'WafpWYepbV13FVM9Qp9brmBTXgjrn3dnfx', value: '10' },
          { data: 'abc d' }
        ]
      }
    });
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
  const getSnapChangeNetwork = wrapWithErrorHandler(async () => {
    return await invokeSnap({
      method: 'htr_changeNetwork',
      params: { newNetwork: 'testnet' }
    });
  });

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
      {isConnected ? (
        <Card className="p-6 bg-green-500/10 border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-2 text-green-400">Connected to Hathor Snap</h2>
                <p className="text-gray-400">
                  Your snap is ready for testing
                  {installedSnap?.version && (
                    <span className="ml-2 text-gray-500 text-sm">
                      (v{installedSnap.version})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setInstalledSnap(null)}
              size="lg"
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            >
              <Unplug className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </Card>
      ) : (
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

      {/* Wallet Info Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Wallet Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SnapMethodCard
            title="Get Address"
            description="Retrieve the wallet address at index 0"
            onExecute={getSnapAddress}
            onError={handleGlobalError}
          />
          <SnapMethodCard
            title="Get Balance"
            description="Get balances for HTR and specified tokens"
            onExecute={getSnapBalance}
            onError={handleGlobalError}
          />
          <SnapMethodCard
            title="Get Network"
            description="Get the currently connected network"
            onExecute={getSnapNetwork}
            onError={handleGlobalError}
          />
        </div>
      </section>

      {/* Transaction Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Transactions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SnapMethodCard
            title="Get UTXOs"
            description="Retrieve unspent transaction outputs"
            onExecute={getSnapUtxos}
            onError={handleGlobalError}
          />
          <SnapMethodCard
            title="Send Transaction"
            description="Send a test transaction with data output"
            onExecute={getSnapSendTx}
            onError={handleGlobalError}
          />
          <SnapMethodCard
            title="Create Token"
            description="Create a new custom token (TST)"
            onExecute={getSnapCreateToken}
            onError={handleGlobalError}
          />
          <SnapMethodCard
            title="Sign with Address"
            description="Sign a message using address index 1"
            onExecute={getSnapSignWithAddress}
            onError={handleGlobalError}
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
          />
          <SnapMethodCard
            title="Create Nano + Token"
            description="Initialize nano contract with token creation"
            onExecute={getSnapSendNanoCreateToken}
            onError={handleGlobalError}
          />
          <SnapMethodCard
            title="Sign Oracle Data"
            description="Sign oracle data for nano contract"
            onExecute={getSnapSignOracleData}
            onError={handleGlobalError}
          />
        </div>
      </section>

      {/* Settings Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SnapMethodCard
            title="Change Network"
            description="Switch to testnet network"
            onExecute={getSnapChangeNetwork}
            onError={handleGlobalError}
          />
        </div>
      </section>
    </div>
  );
};
