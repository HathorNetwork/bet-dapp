import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { WithdrawBetPrizeParams } from './snap-method-handlers';
import { AddressSelector } from './address-selector';
import { TokenSelector } from './token-selector';
import { useWalletState } from '@/contexts/WalletStateContext';

export interface WithdrawBetPrizeCardProps {
  onExecute: (params: WithdrawBetPrizeParams) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  withdrawBetPrizeParams: WithdrawBetPrizeParams;
  setWithdrawBetPrizeParams: (params: WithdrawBetPrizeParams) => void;
}

export const WithdrawBetPrizeCard: React.FC<WithdrawBetPrizeCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  withdrawBetPrizeParams,
  setWithdrawBetPrizeParams,
}) => {
  const [loading, setLoading] = useState(false);
  const { walletState } = useWalletState();

  // Handlers for simple fields
  const handleFieldChange = (field: keyof WithdrawBetPrizeParams, value: any) => {
    setWithdrawBetPrizeParams({ ...withdrawBetPrizeParams, [field]: value });
  };

  return (
    <BaseSnapCard
      title="Withdraw Prize"
      description="Withdraw your prize from a bet nano contract"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                const ncId = walletState.betNanoContract?.ncId || '';
                await executeWrapper(() => onExecute({ ...withdrawBetPrizeParams, ncId }));
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
            {/* Address */}
            <AddressSelector
              walletState={walletState}
              value={withdrawBetPrizeParams.address}
              onChange={(addr) => handleFieldChange('address', addr)}
              label="Withdrawal Address"
              placeholder="Select your address"
              description="Your wallet address to receive the prize"
              knownOnly={false}
            />

            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount</Label>
              <Input
                type="number"
                value={withdrawBetPrizeParams.amount}
                onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="E.g., 100"
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
              <p className="text-xs text-gray-400">
                Amount to withdraw
              </p>
            </div>

            {/* Token */}
            <TokenSelector
              value={withdrawBetPrizeParams.token}
              onChange={(tokenId) => handleFieldChange('token', tokenId)}
              label="Token"
              placeholder="Select token"
              description="Token used for the bet"
            />

            {/* Push TX */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Options</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={withdrawBetPrizeParams.push_tx}
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
