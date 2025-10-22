import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  lastUpdated: number;
}

export interface WalletState {
  addresses: Map<number, AddressData>; // key: index
  balances: Map<string, BalanceData>; // key: token
  utxos: UtxoData[];
  network: NetworkData | null;
  xpub: XpubData | null;
  transactions: Map<string, TransactionData>; // key: hash
}

// Context Type
interface WalletStateContextType {
  walletState: WalletState;
  updateAddress: (addressData: Omit<AddressData, 'lastUpdated'>) => void;
  updateBalance: (balanceData: Omit<BalanceData, 'lastUpdated'>) => void;
  updateUtxos: (utxos: Omit<UtxoData, 'lastUpdated'>[]) => void;
  updateNetwork: (networkData: Omit<NetworkData, 'lastUpdated'>) => void;
  updateXpub: (xpubData: Omit<XpubData, 'lastUpdated'>) => void;
  updateTransaction: (transactionData: Omit<TransactionData, 'lastUpdated'>) => void;
  clearWalletState: () => void;
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
  transactions: new Map(),
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

  // Clear all wallet state
  const clearWalletState = () => {
    setWalletState(initialState);
  };

  const value: WalletStateContextType = {
    walletState,
    updateAddress,
    updateBalance,
    updateUtxos,
    updateNetwork,
    updateXpub,
    updateTransaction,
    clearWalletState,
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
