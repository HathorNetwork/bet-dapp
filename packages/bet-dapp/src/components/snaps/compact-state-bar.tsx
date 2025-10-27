import React from 'react';
import { WalletState } from '@/contexts/WalletStateContext';
import { Button } from '@/components/ui/button';
import { ChevronDown, Network, Wallet, Coins, Database } from 'lucide-react';

interface CompactStateBarProps {
  walletState: WalletState;
  onExpandState: () => void;
}

export const CompactStateBar: React.FC<CompactStateBarProps> = ({
  walletState,
  onExpandState,
}) => {
  // Get primary address (index 0 or first available)
  const primaryAddress = walletState.addresses.get(0)?.address ||
    Array.from(walletState.addresses.values())[0]?.address ||
    'Not loaded';

  // Get HTR balance
  const htrBalance = walletState.balances.get('00');
  const htrBalanceDisplay = htrBalance
    ? `${(htrBalance.balance.unlocked / 100).toFixed(2)} HTR`
    : '0.00 HTR';

  // Count total UTXOs
  const utxoCount = walletState.utxos.size;

  // Get network
  const network = walletState.network?.network || 'unknown';
  const networkDisplay = network.charAt(0).toUpperCase() + network.slice(1);

  // Truncate address for display
  const truncateAddress = (addr: string) => {
    if (addr === 'Not loaded' || addr.length < 20) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between gap-6">
        {/* Left side: Key wallet info */}
        <div className="flex items-center gap-6 text-sm">
          {/* Network */}
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-hathor-yellow-500" />
            <span className="text-gray-400">Network:</span>
            <span className={`font-semibold ${
              network === 'testnet' ? 'text-blue-400' :
              network === 'mainnet' ? 'text-green-400' :
              'text-gray-400'
            }`}>
              {networkDisplay}
            </span>
          </div>

          {/* Address */}
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-hathor-yellow-500" />
            <span className="text-gray-400">Address:</span>
            <span className="font-mono text-gray-300">
              {truncateAddress(primaryAddress)}
            </span>
          </div>

          {/* Balance */}
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-hathor-yellow-500" />
            <span className="text-gray-400">Balance:</span>
            <span className="font-semibold text-green-400">
              {htrBalanceDisplay}
            </span>
          </div>

          {/* UTXOs */}
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-hathor-yellow-500" />
            <span className="text-gray-400">UTXOs:</span>
            <span className="font-semibold text-gray-300">
              {utxoCount}
            </span>
          </div>
        </div>

        {/* Right side: Expand button */}
        <Button
          onClick={onExpandState}
          size="sm"
          variant="outline"
          className="border-hathor-yellow-500/30 hover:border-hathor-yellow-500/50 hover:bg-hathor-yellow-500/10 text-hathor-yellow-500 text-xs"
        >
          View Full State
          <ChevronDown className="ml-2 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
