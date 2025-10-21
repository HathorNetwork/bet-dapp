import React, { useEffect } from 'react';
import { useRequestSnap, useInvokeSnap } from 'snap-utils';
import { SnapMethodCard } from './snap-method-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const SnapTester: React.FC = () => {
  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();

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

  // Wallet Info Methods
  const getSnapAddress = async () => {
    return await invokeSnap({
      method: 'htr_getAddress',
      params: { type: 'index', index: 0 }
    });
  };

  const getSnapBalance = async () => {
    return await invokeSnap({
      method: 'htr_getBalance',
      params: {
        tokens: ['00', '00000337f9db18c355a376697f64fd6e36945fc984d6569b4b0d86e2af185945']
      }
    });
  };

  const getSnapNetwork = async () => {
    return await invokeSnap({ method: 'htr_getConnectedNetwork' });
  };

  // Transaction Methods
  const getSnapUtxos = async () => {
    return await invokeSnap({ method: 'htr_getUtxos', params: {} });
  };

  const getSnapSendTx = async () => {
    return await invokeSnap({
      method: 'htr_sendTransaction',
      params: {
        outputs: [
          { address: 'WafpWYepbV13FVM9Qp9brmBTXgjrn3dnfx', value: '10' },
          { data: 'abc d' }
        ]
      }
    });
  };

  const getSnapCreateToken = async () => {
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
  };

  const getSnapSignWithAddress = async () => {
    return await invokeSnap({
      method: 'htr_signWithAddress',
      params: { message: 'test', addressIndex: 1 }
    });
  };

  // Nano Contract Methods
  const getSnapSendNano = async () => {
    return await invokeSnap({
      method: 'htr_sendNanoContractTx',
      params: {
        'nc_id': '00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490',
        method: 'bet',
        actions: [{ type: 'deposit', token: '00', amount: '1' }],
        args: ['WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N', '1x0']
      }
    });
  };

  const getSnapSendNanoCreateToken = async () => {
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
  };

  const getSnapSignOracleData = async () => {
    return await invokeSnap({
      method: 'htr_signOracleData',
      params: {
        nc_id: '00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490',
        data: '1x0',
        oracle: 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK'
      }
    });
  };

  // Settings Methods
  const getSnapChangeNetwork = async () => {
    return await invokeSnap({
      method: 'htr_changeNetwork',
      params: { newNetwork: 'testnet' }
    });
  };

  return (
    <div className="space-y-8">
      {/* Connect Snap Section */}
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

      {/* Wallet Info Section */}
      <section>
        <h2 className="text-2xl font-bold mb-4 text-hathor-yellow-500">Wallet Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SnapMethodCard
            title="Get Address"
            description="Retrieve the wallet address at index 0"
            onExecute={getSnapAddress}
          />
          <SnapMethodCard
            title="Get Balance"
            description="Get balances for HTR and specified tokens"
            onExecute={getSnapBalance}
          />
          <SnapMethodCard
            title="Get Network"
            description="Get the currently connected network"
            onExecute={getSnapNetwork}
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
          />
          <SnapMethodCard
            title="Send Transaction"
            description="Send a test transaction with data output"
            onExecute={getSnapSendTx}
          />
          <SnapMethodCard
            title="Create Token"
            description="Create a new custom token (TST)"
            onExecute={getSnapCreateToken}
          />
          <SnapMethodCard
            title="Sign with Address"
            description="Sign a message using address index 1"
            onExecute={getSnapSignWithAddress}
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
          />
          <SnapMethodCard
            title="Create Nano + Token"
            description="Initialize nano contract with token creation"
            onExecute={getSnapSendNanoCreateToken}
          />
          <SnapMethodCard
            title="Sign Oracle Data"
            description="Sign oracle data for nano contract"
            onExecute={getSnapSignOracleData}
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
          />
        </div>
      </section>
    </div>
  );
};