import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { SetResultParams } from './snap-method-handlers';
import { AddressSelector } from './address-selector';
import { useWalletState } from '@/contexts/WalletStateContext';

export interface SetResultCardProps {
  onExecute: (params: SetResultParams) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  setResultParams: SetResultParams;
  setSetResultParams: (params: SetResultParams) => void;
}

export const SetBetResultCard: React.FC<SetResultCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  setResultParams,
  setSetResultParams,
}) => {
  const [loading, setLoading] = useState(false);
  const { walletState } = useWalletState();

  // Handlers for simple fields
  const handleFieldChange = (field: keyof SetResultParams, value: any) => {
    setSetResultParams({ ...setResultParams, [field]: value });
  };

  return (
    <BaseSnapCard
      title="Set Result"
      description="Set the result for a bet nano contract (oracle action)"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                const ncId = walletState.betNanoContract?.ncId || '';
                await executeWrapper(() => onExecute({ ...setResultParams, ncId }));
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
              value={setResultParams.oracle}
              onChange={(addr) => handleFieldChange('oracle', addr)}
              label="Oracle Address"
              placeholder="Select oracle address"
              description="The oracle address that will sign and set the result"
              knownOnly={true}
            />

            {/* Result */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Result</Label>
              <Input
                value={setResultParams.result}
                onChange={(e) => handleFieldChange('result', e.target.value)}
                placeholder="E.g., Yes, No, 1x0, 2x0"
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
              <p className="text-xs text-gray-400">
                The result to set for the bet
              </p>
            </div>

            {/* Push TX */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Options</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={setResultParams.push_tx}
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
