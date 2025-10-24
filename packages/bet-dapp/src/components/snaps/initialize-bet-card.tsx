import React, { useState, useEffect } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { CreateBetParams } from './snap-method-handlers';
import { AddressSelector } from './address-selector';
import { TokenSelector } from './token-selector';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { useWalletState } from '@/contexts/WalletStateContext';

export interface CreateBetCardProps {
  onExecute: (params: CreateBetParams) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  createBetParams: CreateBetParams;
  setCreateBetParams: (params: CreateBetParams) => void;
}

export const InitializeBetCard: React.FC<CreateBetCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  createBetParams,
  setCreateBetParams,
}) => {
  const [loading, setLoading] = useState(false);
  const { walletState } = useWalletState();

  // Sync blueprintId from walletState
  useEffect(() => {
    if (walletState.blueprint?.blueprintId && walletState.blueprint.blueprintId !== createBetParams.blueprintId) {
      setCreateBetParams({ ...createBetParams, blueprintId: walletState.blueprint.blueprintId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletState.blueprint?.blueprintId]);

  // Handlers for simple fields
  const handleFieldChange = (field: keyof CreateBetParams, value: any) => {
    setCreateBetParams({ ...createBetParams, [field]: value });
  };

  return (
    <BaseSnapCard
      title="Create Bet"
      description="Initialize a new bet nano contract"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                await executeWrapper(() => onExecute(createBetParams));
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
            {/* Oracle Address */}
            <AddressSelector
              walletState={walletState}
              value={createBetParams.oracleAddress}
              onChange={(addr) => handleFieldChange('oracleAddress', addr)}
              label="Oracle Address"
              placeholder="Select oracle address"
              description="The oracle address that will set the bet result"
              knownOnly={true}
            />

            {/* Token */}
            <TokenSelector
              value={createBetParams.token}
              onChange={(tokenId) => handleFieldChange('token', tokenId)}
              label="Token"
              placeholder="Select token"
              description="Token used for placing bets"
            />

            {/* Bet Deadline */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Bet Deadline</Label>
              <DateTimePicker
                value={createBetParams.deadline}
                onChange={(date) => handleFieldChange('deadline', date)}
              />
              <p className="text-xs text-gray-400">
                Last time users can place a bet. Default: 1 hour from now.
              </p>
            </div>

            {/* Push TX */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Options</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createBetParams.push_tx}
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
