import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TESTNET_INDIA_BET_BLUEPRINT_ID } from '@/components/snaps/constants'

// Type Definitions
export interface AddressData {
  address: string;
  index: number;
  addressPath?: string;
  lastUpdated: number;
}

export interface BalanceData {
  token: {
    id: string;
    name: string;
    symbol: string;
  };
  balance: {
    unlocked: number;
    locked: number;
  };
  tokenAuthorities: {
    unlocked: {
      mint: boolean;
      melt: boolean;
    };
    locked: {
      mint: boolean;
      melt: boolean;
    };
  };
  transactions: number;
  lockExpires: number | null;
  lastUpdated: number;
}

export interface UtxoData {
  txId: string;
  index: number;
  value: string;
  token: string;
  address: string;
  locked: boolean;
  lastUpdated: number;
}

export interface NetworkData {
  network: string;
  genesisHash: string;
  lastUpdated: number;
}

export interface XpubData {
  xpub: string;
  lastUpdated: number;
}

export interface BlueprintData {
  blueprintId: string;
  lastUpdated: number;
}

export interface BetNanoContractData {
  ncId: string;
  hash: string;
  lastUpdated: number;
}

export interface TransactionData {
  hash: string;
  inputs: any[];
  outputs: any[];
  signalBits: number;
  version: number;
  weight: number;
  nonce: number;
  timestamp: number;
  parents: string[];
  tokens: any[];
  headers: any[];
  _dataToSignCache?: any;
  name?: string; // Token name (for token creation transactions)
  symbol?: string; // Token symbol (for token creation transactions)
  lastUpdated: number;
}

// Request history entry for recording session requests
export interface RequestHistoryEntry {
  id: string;
	method: string;
  args: any;
  result?: any;
  error?: boolean;
  timestamp: number;
}

export interface WalletState {
  addresses: Map<number, AddressData>; // key: index
  balances: Map<string, BalanceData>; // key: token
  utxos: UtxoData[];
  network: NetworkData | null;
  xpub: XpubData | null;
  blueprint: BlueprintData | null;
  betNanoContract: BetNanoContractData | null;
  transactions: Map<string, TransactionData>; // key: hash
  requestHistory: RequestHistoryEntry[]; // history of session requests
}

// Context Type
interface WalletStateContextType {
  walletState: WalletState;
  updateAddress: (addressData: Omit<AddressData, 'lastUpdated'>) => void;
  updateBalance: (balanceData: Omit<BalanceData, 'lastUpdated'>) => void;
  updateUtxos: (utxos: Omit<UtxoData, 'lastUpdated'>[]) => void;
  updateNetwork: (networkData: Omit<NetworkData, 'lastUpdated'>) => void;
  updateXpub: (xpubData: Omit<XpubData, 'lastUpdated'>) => void;
  updateBlueprint: (blueprintData: Omit<BlueprintData, 'lastUpdated'>) => void;
  updateBetNanoContract: (betNanoContractData: Omit<BetNanoContractData, 'lastUpdated'>) => void;
  updateTransaction: (transactionData: Omit<TransactionData, 'lastUpdated'>) => void;
  clearUtxos: () => void;
  clearWalletState: () => void;
  // New methods for request history
  addRequestHistory: (entry: Omit<RequestHistoryEntry, 'id' | 'timestamp'>) => void;
  clearRequestHistory: () => void;
}

// Create Context
const WalletStateContext = createContext<WalletStateContextType | undefined>(undefined);

// Initial State
const initialState: WalletState = {
  addresses: new Map(),
  balances: new Map(),
  utxos: [],
  network: null,
  xpub: null,
  blueprint: { blueprintId: TESTNET_INDIA_BET_BLUEPRINT_ID, lastUpdated: Date.now() },
  betNanoContract: null,
  transactions: new Map(),
  requestHistory: [],
};

// Provider Component
export const WalletStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>(initialState);

  // Update address by index
  const updateAddress = (addressData: Omit<AddressData, 'lastUpdated'>) => {
    setWalletState((prev) => {
      const newAddresses = new Map(prev.addresses);
      newAddresses.set(addressData.index, {
        ...addressData,
        lastUpdated: Date.now(),
      });
      return { ...prev, addresses: newAddresses };
    });
  };

  // Update balance by token
  const updateBalance = (balanceData: Omit<BalanceData, 'lastUpdated'>) => {
    setWalletState((prev) => {
      const newBalances = new Map(prev.balances);
      newBalances.set(balanceData.token.id, {
        ...balanceData,
        lastUpdated: Date.now(),
      });
      return { ...prev, balances: newBalances };
    });
  };

  // Update UTXOs (merges with existing UTXOs, using txId+index as unique identifier)
  const updateUtxos = (utxos: Omit<UtxoData, 'lastUpdated'>[]) => {
    setWalletState((prev) => {
      // Create a map of existing UTXOs for efficient lookup
      const utxoMap = new Map<string, UtxoData>();

      // Add existing UTXOs to map
      prev.utxos.forEach(utxo => {
        const key = `${utxo.txId}:${utxo.index}`;
        utxoMap.set(key, utxo);
      });

      // Add or update UTXOs from new batch
      utxos.forEach(utxo => {
        const key = `${utxo.txId}:${utxo.index}`;
        utxoMap.set(key, {
          ...utxo,
          lastUpdated: Date.now(),
        });
      });

      // Convert map back to array
      return {
        ...prev,
        utxos: Array.from(utxoMap.values()),
      };
    });
  };

  // Update network
  const updateNetwork = (networkData: Omit<NetworkData, 'lastUpdated'>) => {
    setWalletState((prev) => ({
      ...prev,
      network: {
        ...networkData,
        lastUpdated: Date.now(),
      },
    }));
  };

  // Update xpub
  const updateXpub = (xpubData: Omit<XpubData, 'lastUpdated'>) => {
    setWalletState((prev) => ({
      ...prev,
      xpub: {
        ...xpubData,
        lastUpdated: Date.now(),
      },
    }));
  };

  // Update blueprint
  const updateBlueprint = (blueprintData: Omit<BlueprintData, 'lastUpdated'>) => {
    setWalletState((prev) => ({
      ...prev,
      blueprint: {
        ...blueprintData,
        lastUpdated: Date.now(),
      },
    }));
  };

  // Update bet nano contract
  const updateBetNanoContract = (betNanoContractData: Omit<BetNanoContractData, 'lastUpdated'>) => {
    setWalletState((prev) => ({
      ...prev,
      betNanoContract: {
        ...betNanoContractData,
        lastUpdated: Date.now(),
      },
    }));
  };

  // Update transaction by hash
  const updateTransaction = (transactionData: Omit<TransactionData, 'lastUpdated'>) => {
    setWalletState((prev) => {
      const newTransactions = new Map(prev.transactions);
      newTransactions.set(transactionData.hash, {
        ...transactionData,
        lastUpdated: Date.now(),
      });
      return { ...prev, transactions: newTransactions };
    });
  };

  // Clear only UTXOs
  const clearUtxos = () => {
    setWalletState((prev) => ({
      ...prev,
      utxos: [],
    }));
  };

  // Clear all wallet state
  const clearWalletState = () => {
    setWalletState(initialState);
  };

  // Add a request to the session history
  const addRequestHistory = (entry: Omit<RequestHistoryEntry, 'id' | 'timestamp'>) => {
    setWalletState((prev) => {
      const newEntry: RequestHistoryEntry = {
				id: `${prev.requestHistory.length}`,
	      timestamp: Date.now(),
	      error: entry.error,
        method: entry.method,
        args: entry.args,
        result: entry.result,
      };
	    console.log(`Executed Snap call: `, newEntry);
      return {
        ...prev,
        requestHistory: [...prev.requestHistory, newEntry],
      };
    });
  };

  // Clear the request history
  const clearRequestHistory = () => {
    setWalletState((prev) => ({
      ...prev,
      requestHistory: [],
    }));
  };

  const value: WalletStateContextType = {
    walletState,
    updateAddress,
    updateBalance,
    updateUtxos,
    updateNetwork,
    updateXpub,
    updateBlueprint,
    updateBetNanoContract,
    updateTransaction,
    clearUtxos,
    clearWalletState,
    addRequestHistory,
    clearRequestHistory,
  };

  return (
    <WalletStateContext.Provider value={value}>
      {children}
    </WalletStateContext.Provider>
  );
};

// Custom Hook
export const useWalletState = (): WalletStateContextType => {
  const context = useContext(WalletStateContext);
  if (context === undefined) {
    throw new Error('useWalletState must be used within a WalletStateProvider');
  }
  return context;
};
