import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { WalletState } from '@/contexts/WalletStateContext';

export interface SignWithAddressCardProps {
  onExecute: (message: string, addressIndex: number) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  walletState: WalletState;
}

export const SignWithAddressCard: React.FC<SignWithAddressCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  walletState,
}) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Hello, Hathor!');
  const [addressIndexMode, setAddressIndexMode] = useState<'known' | 'custom'>('known');
  const [selectedKnownIndex, setSelectedKnownIndex] = useState<string>('0');
  const [customIndex, setCustomIndex] = useState('0');

  const knownAddresses = Array.from(walletState.addresses.values()).sort((a, b) => a.index - b.index);
  const hasKnownAddresses = knownAddresses.length > 0;

  const handleExecute = async () => {
    const addressIndex = addressIndexMode === 'known' 
      ? parseInt(selectedKnownIndex, 10)
      : parseInt(customIndex, 10);

    if (isNaN(addressIndex) || addressIndex < 0) {
      if (onError) {
        onError(new Error('Address index must be a valid non-negative number'));
      }
      return;
    }

    if (!message.trim()) {
      if (onError) {
        onError(new Error('Message cannot be empty'));
      }
      return;
    }

    setLoading(true);
    try {
      await onExecute(message, addressIndex);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseSnapCard
      title="Sign with Address"
      description="Sign a message using a specific address"
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
                Signing
              </>
            ) : (
              'Sign Message'
            )}
          </Button>

          <div className="space-y-3 pt-2">
            {/* Message Input */}
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">
                Message to Sign
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the message you want to sign..."
                className="bg-gray-900/50 border-gray-700 min-h-[80px]"
              />
            </div>

            {/* Address Index Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Address Index</Label>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={addressIndexMode === 'known' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAddressIndexMode('known')}
                  disabled={!hasKnownAddresses}
                  className="flex-1"
                >
                  Known Addresses
                </Button>
                <Button
                  type="button"
                  variant={addressIndexMode === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAddressIndexMode('custom')}
                  className="flex-1"
                >
                  Custom Index
                </Button>
              </div>

              {addressIndexMode === 'known' ? (
                <div className="space-y-2">
                  {hasKnownAddresses ? (
                    <>
                      <Select
                        value={selectedKnownIndex}
                        onValueChange={setSelectedKnownIndex}
                      >
                        <SelectTrigger className="bg-gray-900/50 border-gray-700">
                          <SelectValue placeholder="Select an address" />
                        </SelectTrigger>
                        <SelectContent>
                          {knownAddresses.map((addr) => (
                            <SelectItem key={addr.index} value={String(addr.index)}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">Index {addr.index}</span>
                                <span className="text-xs text-gray-400 font-mono">
                                  {addr.address.substring(0, 20)}...{addr.address.substring(addr.address.length - 8)}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400">
                        Select from your known addresses
                      </p>
                    </>
                  ) : (
                    <div className="text-sm text-gray-400 bg-gray-900/50 border border-gray-700 rounded p-3">
                      No known addresses. Please retrieve addresses first using "Get Address".
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    value={customIndex}
                    onChange={(e) => setCustomIndex(e.target.value)}
                    placeholder="Enter address index (e.g., 0, 1, 2...)"
                    className="bg-gray-900/50 border-gray-700"
                  />
                  <p className="text-xs text-gray-400">
                    Enter any non-negative address index
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </BaseSnapCard>
  );
};

