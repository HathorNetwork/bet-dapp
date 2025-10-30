/**
 * RPC Method Handlers
 *
 * This file contains all the RPC method handlers that interact with wallets via WalletConnect.
 * These handlers are responsible for making RPC requests through WalletConnect client.
 */

import { HATHOR_TESTNET_CHAIN } from '@/constants';
import { saveKnownToken } from '@/lib/tokenStorage';
import { convertBigIntToString } from '@/lib/jsonUtils';
import { getOracleBuffer } from '@/lib/utils';
import { SendTxParams } from './rpc-send-tx-card';
import { CreateTokenParams } from './rpc-create-token-card';
import { InitializeBetParams } from './rpc-initialize-bet-card';
import { BetParams } from './rpc-bet-card';
import { SetResultParams } from './rpc-set-bet-result-card';
import { WithdrawBetPrizeParams } from './rpc-withdraw-bet-prize-card';

export interface RpcHandlerDependencies {
  client: any;
  session: any;
  updateAddress?: (data: any) => void;
  updateNetwork?: (data: any) => void;
  updateBalance?: (data: any) => void;
  balanceTokens?: string[];
}

const DEFAULT_NETWORK = 'testnet';

export const createRpcHandlers = (deps: RpcHandlerDependencies) => {
  const { client, session, updateAddress, updateNetwork, updateBalance, balanceTokens = ['00'] } = deps;

  return {
    /**
     * Get Wallet Information
     * Retrieves both network and address 0 in a single call (no confirmation required)
     */
    getRpcWalletInformation: async () => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      const requestParams = {
        method: 'htr_getWalletInformation',
        network: DEFAULT_NETWORK,
        params: []
      };

      try {
        // Make the RPC request
        const response = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Update context if handlers are provided
        if (response && updateNetwork && updateAddress) {
          try {
            // The response structure should match the snap response
            if (response.network) {
              updateNetwork({
                network: response.network,
                genesisHash: ''
              });
            }

            if (response.address0) {
              updateAddress({
                address: response.address0,
                index: 0,
                addressPath: `m/44'/280'/0'/0/0`
              });
            }
          } catch (e) {
            console.error('Failed to update context with wallet information:', e);
          }
        }

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response: convertBigIntToString(response)
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },

    /**
     * Get Balance
     * Retrieves balances for specified tokens
     */
    getRpcBalance: async () => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      const filteredTokens = balanceTokens.filter(token => token.trim() !== '');

      const requestParams = {
        method: 'htr_getBalance',
        params: {
          network: DEFAULT_NETWORK,
          tokens: filteredTokens
        }
      };

      try {
        // Make the RPC request
        const result = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Update context if handlers are provided
        if (result && updateBalance && result.response && Array.isArray(result.response)) {
          try {
            result.response.forEach((balanceItem: any) => {
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
          } catch (e) {
            console.error('Failed to update context with balance data:', e);
          }
        }

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response: convertBigIntToString(result)
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },

    /**
     * Sign with Address
     * Signs a message using a specific address
     */
    getRpcSignWithAddress: async (message: string = 'test', addressIndex: number = 0) => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      const requestParams = {
        method: 'htr_signWithAddress',
        params: {
          network: DEFAULT_NETWORK,
          message,
          addressIndex
        }
      };

      try {
        // Make the RPC request
        const response = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },

    /**
     * Sign Oracle Data
     * Signs oracle data for nano contract
     */
    getRpcSignOracleData: async (ncId: string, data: string, oracle: string) => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      const requestParams = {
        method: 'htr_signOracleData',
        params: {
          network: DEFAULT_NETWORK,
          nc_id: ncId,
          data,
          oracle
        }
      };

      try {
        // Make the RPC request
        const response = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response: convertBigIntToString(response)
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },

    /**
     * Send Transaction
     * Sends a transaction with custom outputs and inputs
     */
    getRpcSendTransaction: async (params: SendTxParams) => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

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

      const invokeParams: any = {
        network: DEFAULT_NETWORK,
        outputs
      };

      if (params.inputs && params.inputs.length > 0) {
        invokeParams.inputs = params.inputs.map(input => ({
          txId: input.txId,
          index: parseInt(input.index, 10)
        }));
      }

      if (params.changeAddress && params.changeAddress.trim()) {
        invokeParams.changeAddress = params.changeAddress;
      }

      const requestParams = {
        method: 'htr_sendTransaction',
        params: invokeParams
      };

      try {
        // Make the RPC request
        const response = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response: convertBigIntToString(response)
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },

    /**
     * Create Token
     * Creates a new custom token with optional mint/melt authorities
     */
    getRpcCreateToken: async (params: CreateTokenParams) => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      const invokeParams: any = {
        network: DEFAULT_NETWORK,
        name: params.name,
        symbol: params.symbol,
        amount: params.amount,
        create_mint: params.create_mint,
        create_melt: params.create_melt,
      };

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

      const requestParams = {
        method: 'htr_createToken',
        params: invokeParams
      };

      try {
        // Make the RPC request
        const response = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response: convertBigIntToString(response)
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },

    /**
     * Initialize Bet
     * Initialize a new bet nano contract
     */
    getRpcInitializeBet: async (params: InitializeBetParams) => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      // Convert oracle address to buffer hex string
      const oracleBuffer = getOracleBuffer(params.oracleAddress);

      // Convert Date to unix timestamp (seconds)
      const timestamp = Math.floor(params.deadline.getTime() / 1000);

      const invokeParams: any = {
        network: DEFAULT_NETWORK,
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

      const requestParams = {
        method: 'htr_sendNanoContractTx',
        params: invokeParams
      };

      try {
        // Make the RPC request
        const response = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response: convertBigIntToString(response)
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },

    /**
     * Place Bet
     * Place a bet on an existing bet nano contract
     */
    getRpcBet: async (params: BetParams) => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      const invokeParams: any = {
        network: DEFAULT_NETWORK,
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

      const requestParams = {
        method: 'htr_sendNanoContractTx',
        params: invokeParams
      };

      try {
        // Make the RPC request
        const response = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response: convertBigIntToString(response)
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },

    /**
     * Set Result
     * Set the result for a bet nano contract (oracle action)
     */
    getRpcSetResult: async (params: SetResultParams) => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      // First, sign the oracle data
      const signRequestParams = {
        method: 'htr_signOracleData',
        params: {
          network: DEFAULT_NETWORK,
          nc_id: params.ncId,
          data: params.result,
          oracle: params.oracle
        }
      };

      let signedData: string;
      try {
        const signResponse = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: signRequestParams
        });

        // Parse the signed data from the response
        if (signResponse?.response?.signedData) {
          signedData = signResponse.response.signedData;
        } else {
          throw new Error('Failed to extract signed data from oracle signature response');
        }
      } catch (error) {
        console.error('Failed to sign oracle data:', error);
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = signRequestParams;
        throw errorWithRequest;
      }

      // Now send the set_result transaction with the signed data
      const invokeParams: any = {
        network: DEFAULT_NETWORK,
        method: 'set_result',
        nc_id: params.ncId,
        actions: [],
        args: [signedData],
        push_tx: params.push_tx,
      };

      const requestParams = {
        method: 'htr_sendNanoContractTx',
        params: invokeParams
      };

      try {
        // Make the RPC request
        const response = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response: convertBigIntToString(response)
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },

    /**
     * Withdraw Bet Prize
     * Withdraw prize from a bet nano contract
     */
    getRpcWithdrawBetPrize: async (params: WithdrawBetPrizeParams) => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      const invokeParams: any = {
        network: DEFAULT_NETWORK,
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

      const requestParams = {
        method: 'htr_sendNanoContractTx',
        params: invokeParams
      };

      try {
        // Make the RPC request
        const response = await client.request({
          topic: session.topic,
          chainId: HATHOR_TESTNET_CHAIN,
          request: requestParams
        });

        // Return both request and response (with BigInt converted to string)
        return {
          request: requestParams,
          response: convertBigIntToString(response)
        };
      } catch (error) {
        // Attach request params to the error so the UI can display them
        const errorWithRequest = error as any;
        errorWithRequest.requestParams = requestParams;
        throw errorWithRequest;
      }
    },
  };
};
