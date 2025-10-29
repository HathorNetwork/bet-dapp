/**
 * RPC Method Handlers
 *
 * This file contains all the RPC method handlers that interact with wallets via WalletConnect.
 * These handlers are responsible for making RPC requests through WalletConnect client.
 */

import { HATHOR_TESTNET_CHAIN } from '@/constants';

export interface RpcHandlerDependencies {
  client: any;
  session: any;
  updateAddress?: (data: any) => void;
  updateNetwork?: (data: any) => void;
  updateBalance?: (data: any) => void;
  balanceTokens?: string[];
}

const DEFAULT_NETWORK = 'testnet';

// Custom JSON serializer that handles BigInt
const jsonStringify = (obj: any) => {
  return JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value,
    2
  );
};

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

      // Make the RPC request
      const response = await client.request({
        topic: session.topic,
        chainId: HATHOR_TESTNET_CHAIN,
        request: {
          method: 'htr_getWalletInformation',
	        networ: DEFAULT_NETWORK,
          params: []
        }
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

      // Return stringified result to match snap format
      return jsonStringify(response);
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

      // Make the RPC request
      const response = await client.request({
        topic: session.topic,
        chainId: HATHOR_TESTNET_CHAIN,
        request: {
          method: 'htr_getBalance',
          params: {
						network: DEFAULT_NETWORK,
            tokens: filteredTokens
          }
        }
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

            // TODO: Save token metadata to localStorage if needed
            // saveKnownToken({
            //   id: balanceItem.token.id,
            //   name: balanceItem.token.name,
            //   symbol: balanceItem.token.symbol,
            // });
          });
        } catch (e) {
          console.error('Failed to update context with balance data:', e);
        }
      }

      // Return stringified result to match snap format
      return jsonStringify(response);
    },

    /**
     * Sign with Address
     * Signs a message using a specific address
     */
    getRpcSignWithAddress: async (message: string = 'test', addressIndex: number = 0) => {
      if (!session || !client) {
        throw new Error('WalletConnect session not available');
      }

      // Make the RPC request
      const response = await client.request({
        topic: session.topic,
        chainId: HATHOR_TESTNET_CHAIN,
        request: {
          method: 'htr_signWithAddress',
          params: {
            network: DEFAULT_NETWORK,
            message,
            addressIndex
          }
        }
      });

      // Return stringified result to match snap format
      return jsonStringify(response);
    },
  };
};
