/**
 * Snap Method Handlers
 *
 * This file contains all the snap method handlers that interact with the Hathor Snap.
 * These handlers are responsible for invoking snap methods and updating the wallet state context.
 */

import { NetworkData } from '@/contexts/WalletStateContext';
import { saveKnownToken } from '@/lib/tokenStorage';
import { getOracleBuffer } from '@/lib/utils';


export interface SendTxParams {
  outputs: Array<{
    type: 'address' | 'data';
    address?: string;
    value?: string;
    token?: string;
    data?: string;
    dataType?: string;
  }>;
  inputs: Array<{
    txId: string;
    index: string;
  }>;
  changeAddress?: string;
}

export interface CreateTokenParams {
  name: string;
  symbol: string;
  amount: string;
  address?: string;
  change_address?: string;
  create_mint: boolean;
  mint_authority_address?: string;
  allow_external_mint_authority_address: boolean;
  create_melt: boolean;
  melt_authority_address?: string;
  allow_external_melt_authority_address: boolean;
  data: string[];
  push_tx: boolean;
}

export interface SnapHandlerDependencies {
  invokeSnap: (params: any) => Promise<any>;
  updateAddress: (data: any) => void;
  updateBalance: (data: any) => void;
  updateUtxos: (data: any) => void;
  updateNetwork: (data: any) => void;
  updateXpub: (data: any) => void;
  updateBetNanoContract: (data: any) => void;
  updateTransaction: (data: any) => void;
  clearWalletState: () => void;
  balanceTokens?: string[];
}

// Add params interface for sending Nano Contract transactions
export interface SendNanoParams {
  method: string;
  blueprint_id?: string;
  nc_id?: string;
  actions?: unknown[];
  args: unknown[];
  push_tx: boolean;
}

// Add params interface for Create Nano + Token transactions
export interface SendNanoCreateTokenParams {
  method: string;
  address: string;
  data?: unknown;
  createTokenOptions?: unknown;
  options?: unknown;
  push_tx: boolean;
}

// Add params interface for Create Bet nano contract
export interface InitializeBetParams {
  blueprintId: string;   // Blueprint ID for the bet nano contract
  oracleAddress: string; // Oracle wallet address (will be converted to buffer in handler)
  token: string;         // Token ID (e.g., '00' for HTR)
  deadline: Date;        // Bet deadline as Date object (will be converted to unix timestamp)
  push_tx: boolean;
}

// Add params interface for placing a bet on an existing bet contract
export interface BetParams {
  ncId: string;          // Nano contract ID of the existing bet
  betChoice: string;     // The bet option/choice (e.g., 'Yes', 'No', '1x0', '2x0')
  amount: number;        // Amount to bet (will be multiplied by 100 for transaction)
  address: string;       // User's wallet address
  token: string;         // Token ID (e.g., '00' for HTR)
  push_tx: boolean;
}

// Add params interface for setting the result of a bet contract (oracle action)
export interface SetResultParams {
  ncId: string;          // Nano contract ID of the existing bet
  oracle: string;        // Oracle address that will sign the result
  result: string;        // The result to set (e.g., 'Yes', 'No', '1x0', '2x0')
  push_tx: boolean;
}

// Add params interface for withdrawing prize from a bet contract
export interface WithdrawBetPrizeParams {
  ncId: string;          // Nano contract ID of the existing bet
  address: string;       // User's wallet address to receive the prize
  amount: number;        // Amount to withdraw
  token: string;         // Token ID (e.g., '00' for HTR)
  push_tx: boolean;
}

export const createSnapHandlers = (deps: SnapHandlerDependencies) => {
  const {
    invokeSnap,
    updateAddress,
    updateBalance,
    updateUtxos,
    updateNetwork,
    updateXpub,
    updateBetNanoContract,
    updateTransaction,
    clearWalletState,
    balanceTokens = ['00'],
  } = deps;

  return {
    getSnapNetwork: async () => {
      const result = await invokeSnap({ method: 'htr_getConnectedNetwork' });

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
    },

    getSnapAddress: async (addressIndex = 0) => {
      const result = await invokeSnap({
        method: 'htr_getAddress',
        params: { type: 'index', index: addressIndex }
      });

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
    },

    getSnapBalance: async () => {
      const filteredTokens = balanceTokens.filter(token => token.trim() !== '');

      const result = await invokeSnap({
        method: 'htr_getBalance',
        params: {
          tokens: filteredTokens
        }
      });

      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 3 && Array.isArray(parsed.response)) {
            parsed.response.forEach((balanceItem: any) => {
              updateBalance({
                token: balanceItem.token,
                balance: balanceItem.balance,
                tokenAuthorities: balanceItem.tokenAuthorities,
                transactions: balanceItem.transactions,
                lockExpires: balanceItem.lockExpires,
              });

              // Save token metadata to localStorage
              saveKnownToken({
                id: balanceItem.token.id,
                name: balanceItem.token.name,
                symbol: balanceItem.token.symbol,
              });
            });
          }
        } catch (e) {
          console.error('Failed to parse balance response:', e);
        }
      }

      return result;
    },

    getSnapWalletInformation: async () => {
      const result = await invokeSnap({ method: 'htr_getWalletInformation' });

      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 12 && parsed.response) {
            const { network, address0 } = parsed.response;

            if (network) {
              updateNetwork({ network, genesisHash: '' });
            }

            if (address0) {
              updateAddress({ address: address0, index: 0, addressPath: `m/44'/280'/0'/0/0` } );
            }
          }
        } catch (e) {
          console.error('Failed to parse wallet information response:', e);
        }
      }

      return result;
    },

    getSnapXpub: async () => {
      const result = await invokeSnap({ method: 'htr_getXpub' });

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
    },

    getSnapUtxosSimple: async (tokenUid: string = '00') => {
      const result = await invokeSnap({
        method: 'htr_getUtxos',
        params: { token: tokenUid }
      });

      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 5 && parsed.response && Array.isArray(parsed.response.utxos)) {
            const utxos = parsed.response.utxos.map((utxo: any) => ({
              txId: utxo.tx_id,
              index: utxo.index,
              value: String(utxo.amount),
              token: tokenUid,
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
    },

    getSnapUtxosAdvanced: async (inputValues?: Record<string, string>) => {
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

      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 5 && parsed.response && Array.isArray(parsed.response.utxos)) {
            const utxos = parsed.response.utxos.map((utxo: any) => ({
              txId: utxo.tx_id,
              index: utxo.index,
              value: String(utxo.amount),
              token: params.token ?? '00',
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
    },

    getSnapSendTx: async (params: SendTxParams) => {
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

      const invokeParams: any = { outputs };

      if (params.inputs && params.inputs.length > 0) {
        invokeParams.inputs = params.inputs.map(input => ({
          txId: input.txId,
          index: parseInt(input.index, 10)
        }));
      }

      if (params.changeAddress && params.changeAddress.trim()) {
        invokeParams.changeAddress = params.changeAddress;
      }

      const result = await invokeSnap({
        method: 'htr_sendTransaction',
        params: invokeParams
      });

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
    },

    getSnapCreateToken: async (params: CreateTokenParams) => {
      const invokeParams: any = {
        name: params.name,
        symbol: params.symbol,
        amount: params.amount,
        create_mint: params.create_mint,
        create_melt: params.create_melt,
        push_tx: params.push_tx,
      };

      if (params.address && params.address.trim()) {
        invokeParams.address = params.address;
      }
      if (params.change_address && params.change_address.trim()) {
        invokeParams.change_address = params.change_address;
      }
      if (params.create_mint && params.mint_authority_address && params.mint_authority_address.trim()) {
        invokeParams.mint_authority_address = params.mint_authority_address;
      }
      if (params.create_mint) {
        invokeParams.allow_external_mint_authority_address = params.allow_external_mint_authority_address;
      }
      if (params.create_melt && params.melt_authority_address && params.melt_authority_address.trim()) {
        invokeParams.melt_authority_address = params.melt_authority_address;
      }
      if (params.create_melt) {
        invokeParams.allow_external_melt_authority_address = params.allow_external_melt_authority_address;
      }
      if (params.data && params.data.length > 0) {
        const filteredData = params.data.filter(d => d.trim() !== '');
        if (filteredData.length > 0) {
          invokeParams.data = filteredData;
        }
      }

      console.log(`Invoking createToken with params:`, invokeParams);

      const result = await invokeSnap({
        method: 'htr_createToken',
        params: invokeParams
      });

      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 6 && parsed.response) {
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
              name: txData.name,
              symbol: txData.symbol,
            });
          }
        } catch (e) {
          console.error('Failed to parse create token response:', e);
        }
      }

      return result;
    },

    getSnapSignWithAddress: async (message: string = 'test', addressIndex: number = 0) => {
      return await invokeSnap({
        method: 'htr_signWithAddress',
        params: { message, addressIndex }
      });
    },

    getSnapSendNano: async (params: SendNanoParams) => {
      const invokeParams: any = {
        method: params.method,
        args: params.args,
        push_tx: params.push_tx,
      };

      if (params.blueprint_id && String(params.blueprint_id).trim()) {
        invokeParams.blueprint_id = params.blueprint_id;
      }
      if (params.nc_id && String(params.nc_id).trim()) {
        invokeParams.nc_id = params.nc_id;
      }
      if (params.actions && Array.isArray(params.actions) && params.actions.length > 0) {
        invokeParams.actions = params.actions;
      }

      const result = await invokeSnap({
        method: 'htr_sendNanoContractTx',
        params: invokeParams,
      });

      // Parse and update wallet state with transaction data
      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 0 && parsed.response) {
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
          console.error('Failed to parse nano contract transaction response:', e);
        }
      }

      return result;
    },

    getSnapSendNanoCreateToken: async (params: SendNanoCreateTokenParams) => {
      const invokeParams: any = {
        method: params.method,
        address: params.address,
        push_tx: params.push_tx,
      };

      if (params.data) {
        invokeParams.data = params.data;
      }
      if (params.createTokenOptions) {
        invokeParams.createTokenOptions = params.createTokenOptions;
      }
      if (params.options) {
        invokeParams.options = params.options;
      }

      const result = await invokeSnap({
        method: 'htr_createNanoContractCreateTokenTx',
        params: invokeParams
      });

      // Parse and update wallet state with transaction data
      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 0 && parsed.response) {
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
          console.error('Failed to parse nano contract create token transaction response:', e);
        }
      }

      return result;

			/*
			 * Sample parameters:
			 * params: {
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
			 */
    },

    getSnapCreateBet: async (params: InitializeBetParams) => {
      // Convert oracle address to buffer hex string
      const oracleBuffer = getOracleBuffer(params.oracleAddress);

      // Convert Date to unix timestamp (seconds)
      const timestamp = Math.floor(params.deadline.getTime() / 1000);

      const invokeParams: any = {
        method: 'initialize',
        blueprint_id: params.blueprintId,
        actions: [],
        args: [
          oracleBuffer,
          params.token,
          timestamp,
        ],
        push_tx: params.push_tx,
        nc_id: null,
      };

      const result = await invokeSnap({
        method: 'htr_sendNanoContractTx',
        params: invokeParams
      });

      // Parse and update wallet state with transaction data
      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 0 && parsed.response) {
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

            // Store the bet nano contract ID (the hash is the ncId for initialize transactions)
            updateBetNanoContract({
              ncId: txData.hash,
              hash: txData.hash,
            });
          }
        } catch (e) {
          console.error('Failed to parse create bet transaction response:', e);
        }
      }

      return result;
    },

    getSnapBet: async (params: BetParams) => {
      // Convert amount to the correct format (multiply by 100 and round)
	    const invokeParams: any = {
        method: 'bet',
        nc_id: params.ncId,
        actions: [{
          type: 'deposit',
          token: params.token,
          amount: params.amount.toString(),
          changeAddress: params.address,
        }],
        args: [
          params.address,
          params.betChoice,
        ],
        push_tx: params.push_tx,
      };

      const result = await invokeSnap({
        method: 'htr_sendNanoContractTx',
        params: invokeParams
      });

      // Parse and update wallet state with transaction data
      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 0 && parsed.response) {
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
          console.error('Failed to parse bet transaction response:', e);
        }
      }

      return result;
    },

    getSnapSetResult: async (params: SetResultParams) => {
      // First, sign the oracle data
      const signResult = await invokeSnap({
        method: 'htr_signOracleData',
        params: {
          nc_id: params.ncId,
          data: params.result,
          oracle: params.oracle
        }
      });

      // Parse the signed data from the response
      let signedData: string;
      try {
        const parsed = JSON.parse(signResult as string);
        if (parsed.response && parsed.response.signedData) {
          signedData = parsed.response.signedData;
        } else {
          throw new Error('Failed to extract signed data from oracle signature response');
        }
      } catch (e) {
        console.error('Failed to parse sign oracle data response:', e);
        throw e;
      }

      // Now send the set_result transaction with the signed data
      const invokeParams: any = {
        method: 'set_result',
        nc_id: params.ncId,
        actions: [],
        args: [signedData],
        push_tx: params.push_tx,
      };

      const result = await invokeSnap({
        method: 'htr_sendNanoContractTx',
        params: invokeParams
      });

      // Parse and update wallet state with transaction data
      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 0 && parsed.response) {
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
          console.error('Failed to parse set result transaction response:', e);
        }
      }

      return result;
    },

    getSnapWithdrawBetPrize: async (params: WithdrawBetPrizeParams) => {
      const invokeParams: any = {
        method: 'withdraw',
        nc_id: params.ncId,
        actions: [{
          type: 'withdrawal',
          address: params.address,
          amount: params.amount.toString(),
          token: params.token,
          changeAddress: params.address,
        }],
        args: [],
        push_tx: params.push_tx,
      };

      const result = await invokeSnap({
        method: 'htr_sendNanoContractTx',
        params: invokeParams
      });

      // Parse and update wallet state with transaction data
      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 0 && parsed.response) {
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
          console.error('Failed to parse withdraw bet prize transaction response:', e);
        }
      }

      return result;
    },

    getSnapSignOracleData: async (ncId: string, data: string, oracle: string) => {
      return await invokeSnap({
        method: 'htr_signOracleData',
        params: {
          nc_id: ncId,
          data: data,
          oracle: oracle
        }
      });
    },

    getSnapChangeNetwork: async (newNetwork: 'testnet' | 'mainnet' = 'testnet') => {
      return await invokeSnap({
        method: 'htr_changeNetwork',
        params: { newNetwork: newNetwork }
      }).then((data) => {
        const typedData = (JSON.parse(data as string) ?? {}) as { type: number; response: { newNetwork: string } };

        if (!typedData.response) {
          return;
        }

        clearWalletState();
        const newData: NetworkData = {
          network: typedData.response.newNetwork,
          genesisHash: '',
          lastUpdated: Date.now(),
        };
        updateNetwork(newData);
      });
    },
  };
};
