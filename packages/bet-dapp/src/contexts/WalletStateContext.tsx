import React, { createContext, useContext, useState, ReactNode } from 'react';

// Type Definitions
export interface AddressData {
  address: string;
  index: number;
  addressPath: string;
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
  lastUpdated: number;
}

export interface WalletState {
  addresses: Map<number, AddressData>; // key: index
  balances: Map<string, BalanceData>; // key: token
  utxos: UtxoData[];
  network: string | null;
}

// Context Type
interface WalletStateContextType {
  walletState: WalletState;
  updateAddress: (addressData: Omit<AddressData, 'lastUpdated'>) => void;
  updateBalance: (balanceData: Omit<BalanceData, 'lastUpdated'>) => void;
  updateUtxos: (utxos: Omit<UtxoData, 'lastUpdated'>[]) => void;
  updateNetwork: (network: string) => void;
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

  // Update UTXOs (replaces entire array)
  const updateUtxos = (utxos: Omit<UtxoData, 'lastUpdated'>[]) => {
    setWalletState((prev) => ({
      ...prev,
      utxos: utxos.map(utxo => ({
        ...utxo,
        lastUpdated: Date.now(),
      })),
    }));
  };

  // Update network
  const updateNetwork = (network: string) => {
    setWalletState((prev) => ({ ...prev, network }));
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