import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { TokenSelector } from './token-selector';
import { AddressSelector } from './address-selector';
import React, { useState } from 'react';
import { WalletState } from '@/contexts/WalletStateContext';

export interface GetUtxosAdvancedCardProps {
  onExecute: (inputValues: Record<string, string>) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  walletState: WalletState;
}

export const GetUtxosAdvancedCard: React.FC<GetUtxosAdvancedCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  walletState,
}) => {
  const [loading, setLoading] = useState(false);
  const [maxUtxos, setMaxUtxos] = useState('');
  const [tokenId, setTokenId] = useState('00');
  const [filterAddress, setFilterAddress] = useState('');
  const [authorities, setAuthorities] = useState('none');
  const [amountSmallerThan, setAmountSmallerThan] = useState('');
  const [amountBiggerThan, setAmountBiggerThan] = useState('');
  const [maximumAmount, setMaximumAmount] = useState('');
  const [onlyAvailableUtxos, setOnlyAvailableUtxos] = useState('none');

  const handleExecute = async () => {
    setLoading(true);
    try {
      const inputValues: Record<string, string> = {
        maxUtxos,
        token: tokenId,
        filterAddress,
        authorities: authorities === 'none' ? '' : authorities,
        amountSmallerThan,
        amountBiggerThan,
        maximumAmount,
        onlyAvailableUtxos: onlyAvailableUtxos === 'none' ? '' : onlyAvailableUtxos,
      };
      return await onExecute(inputValues);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseSnapCard
      title="Get UTXOs (Advanced)"
      description="Retrieve UTXOs with advanced filtering options"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              await executeWrapper(handleExecute);
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

          <div className="pt-2 space-y-4">
            {/* Max UTXOs */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Max UTXOs</Label>
              <Input
                type="text"
                value={maxUtxos}
                onChange={(e) => setMaxUtxos(e.target.value)}
                placeholder="Maximum number of UTXOs to return"
                className="bg-gray-900/50 border-gray-700"
              />
            </div>

            {/* Token Selector */}
            <TokenSelector
              value={tokenId}
              onChange={setTokenId}
              label="Token ID"
              placeholder="Select from known tokens"
              description="Filter by token (e.g., 00 for HTR)"
              knownOnly={true}
            />

            {/* Address Selector */}
            <AddressSelector
              walletState={walletState}
              value={filterAddress}
              onChange={setFilterAddress}
              label="Address"
              placeholder="Select from known addresses"
              description="Filter by specific address"
              knownOnly={true}
              clearButton={true}
            />

            {/* Authorities Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Authorities</Label>
              <div className="flex gap-2">
                <Select
                  value={authorities}
                  onValueChange={setAuthorities}
                >
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No filter (all authorities)</SelectItem>
                    <SelectItem value="1">Mint</SelectItem>
                    <SelectItem value="2">Melt</SelectItem>
                  </SelectContent>
                </Select>
                {authorities !== 'none' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAuthorities('none');
                    }}
                    className="flex-shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400">Filter by authority mask</p>
            </div>

            {/* Amount Smaller Than */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount {'<'}</Label>
              <Input
                type="text"
                value={amountSmallerThan}
                onChange={(e) => setAmountSmallerThan(e.target.value)}
                placeholder="Maximum amount per UTXO"
                className="bg-gray-900/50 border-gray-700"
              />
            </div>

            {/* Amount Bigger Than */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount {'>'}</Label>
              <Input
                type="text"
                value={amountBiggerThan}
                onChange={(e) => setAmountBiggerThan(e.target.value)}
                placeholder="Minimum amount per UTXO"
                className="bg-gray-900/50 border-gray-700"
              />
            </div>

            {/* Maximum Amount */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Max Amount</Label>
              <Input
                type="text"
                value={maximumAmount}
                onChange={(e) => setMaximumAmount(e.target.value)}
                placeholder="Maximum total amount"
                className="bg-gray-900/50 border-gray-700"
              />
            </div>

            {/* Only Available UTXOs */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Available Only</Label>
              <div className="flex gap-2">
                <Select
                  value={onlyAvailableUtxos}
                  onValueChange={setOnlyAvailableUtxos}
                >
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not specified</SelectItem>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
                {onlyAvailableUtxos !== 'none' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOnlyAvailableUtxos('none');
                    }}
                    className="flex-shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-400">Only return available (unlocked) UTXOs</p>
            </div>
          </div>
        </>
      )}
    </BaseSnapCard>
  );
};
