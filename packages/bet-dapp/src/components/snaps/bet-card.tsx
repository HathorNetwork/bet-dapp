import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { BetParams } from './snap-method-handlers';
import { AddressSelector } from './address-selector';
import { TokenSelector } from './token-selector';
import { useWalletState } from '@/contexts/WalletStateContext';

export interface BetCardProps {
  onExecute: (params: BetParams) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  betParams: BetParams;
  setBetParams: (params: BetParams) => void;
}

export const BetCard: React.FC<BetCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  betParams,
  setBetParams,
}) => {
  const [loading, setLoading] = useState(false);
  const { walletState } = useWalletState();

  // Handlers for simple fields
  const handleFieldChange = (field: keyof BetParams, value: any) => {
    setBetParams({ ...betParams, [field]: value });
  };

  return (
    <BaseSnapCard
      title="Place Bet"
      description="Place a bet on an existing bet nano contract"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                await executeWrapper(() => onExecute(betParams));
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || disabled}
            className="ml-auto flex-shrink-0"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading
              </>
            ) : (
              'Execute'
            )}
          </Button>

          <div className="space-y-4 pt-2">
            {/* Nano Contract ID */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bet Contract ID</Label>
              <Input
                value={betParams.ncId}
                onChange={(e) => handleFieldChange('ncId', e.target.value)}
                placeholder="Nano contract ID (e.g., 00000d69f91...)"
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
              <p className="text-xs text-gray-400">
                The ID of the existing bet nano contract
              </p>
            </div>

            {/* Bet Choice */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bet Choice</Label>
              <Input
                value={betParams.betChoice}
                onChange={(e) => handleFieldChange('betChoice', e.target.value)}
                placeholder="E.g., Yes, No, 1x0, 2x0"
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
              <p className="text-xs text-gray-400">
                Your prediction/choice for the bet outcome
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount</Label>
              <Input
                type="number"
                value={betParams.amount}
                onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="E.g., 100"
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
              <p className="text-xs text-gray-400">
                Amount to bet
              </p>
            </div>

            {/* Address */}
            <AddressSelector
              walletState={walletState}
              value={betParams.address}
              onChange={(addr) => handleFieldChange('address', addr)}
              label="Your Address"
              placeholder="Select your address"
              description="Your wallet address for placing the bet"
              knownOnly={false}
            />

            {/* Token */}
            <TokenSelector
              value={betParams.token}
              onChange={(tokenId) => handleFieldChange('token', tokenId)}
              label="Token"
              placeholder="Select token"
              description="Token used for placing the bet"
            />

            {/* Push TX */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Options</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={betParams.push_tx}
                  onChange={(e) => handleFieldChange('push_tx', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-300">Push Transaction</span>
              </div>
            </div>
          </div>
        </>
      )}
    </BaseSnapCard>
  );
};
