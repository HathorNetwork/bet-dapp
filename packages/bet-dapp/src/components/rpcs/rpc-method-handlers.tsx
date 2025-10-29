/**
 * RPC Method Handlers
 *
 * This file contains all the RPC method handlers that interact with wallets via WalletConnect.
 * These handlers are responsible for making RPC requests through WalletConnect client.
 */

import { HATHOR_TESTNET_CHAIN } from '@/constants';
import { saveKnownToken } from '@/lib/tokenStorage';
import { convertBigIntToString } from '@/lib/jsonUtils';
import { SendTxParams } from './rpc-send-tx-card';

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

      // Make the RPC request
      const response = await client.request({
        topic: session.topic,
        chainId: HATHOR_TESTNET_CHAIN,
        request: requestParams
      });

      // Update context if handlers are provided
      if (response && updateBalance && Array.isArray(response)) {
        try {
          response.forEach((balanceItem: any) => {
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
        response: convertBigIntToString(response)
      };
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
    },
  };
};
