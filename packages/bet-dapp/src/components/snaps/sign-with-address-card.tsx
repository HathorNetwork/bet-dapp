import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle2, Copy } from 'lucide-react';
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
  const [parsedResult, setParsedResult] = useState<{
    message: string;
    signature: string;
    address: {
      address: string;
      index: number;
      addressPath: string;
    };
  } | null>(null);

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
    setParsedResult(null);
    try {
      const result = await onExecute(message, addressIndex);

      // Parse the result
      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 1 && parsed.response) {
            setParsedResult(parsed.response);
          }
        } catch (e) {
          console.error('Failed to parse sign with address response:', e);
        }
      }
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
                                  {`${addr.address.substring(0, 20)}...${addr.address.substring(addr.address.length - 8)}`}
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
                      No known addresses. Please retrieve addresses first using &quot;Get Address&quot;.
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

            {/* Display parsed result */}
            {parsedResult && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-700/50 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Message Signed Successfully</span>
                </div>

                <div className="space-y-3 text-sm">
                  {/* Message */}
                  <div>
                    <Label className="text-xs text-gray-400">Message</Label>
                    <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-gray-200 break-words">
                      {parsedResult.message}
                    </div>
                  </div>

                  {/* Signature */}
                  <div>
                    <Label className="text-xs text-gray-400">
	                    Signature&nbsp;
	                    <button
		                    onClick={() => navigator.clipboard.writeText(parsedResult?.signature)}
		                    className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
		                    title="Copy to clipboard"
	                    >
		                    <Copy className="h-3 w-3" />
	                    </button>
										</Label>
                    <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-xs text-gray-200 break-all">
                      {parsedResult.signature}
                    </div>
                  </div>

                  {/* Address Details */}
                  <div>
                    <Label className="text-xs text-gray-400">Signed with Address</Label>
                    <div className="mt-1 space-y-2">
                      <div className="p-2 bg-gray-900/50 rounded border border-gray-700">
                        <div className="text-xs text-gray-400">
	                        Address&nbsp;
	                        <button
		                        onClick={() => navigator.clipboard.writeText(parsedResult?.address.address)}
		                        className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
		                        title="Copy to clipboard"
	                        >
		                        <Copy className="h-3 w-3" />
	                        </button>
												</div>
                        <div className="font-mono text-gray-200 break-all">{parsedResult.address.address}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-gray-900/50 rounded border border-gray-700">
                          <div className="text-xs text-gray-400">Index</div>
                          <div className="font-mono text-gray-200">{parsedResult.address.index}</div>
                        </div>
                        <div className="p-2 bg-gray-900/50 rounded border border-gray-700">
                          <div className="text-xs text-gray-400">Address Path</div>
                          <div className="font-mono text-xs text-gray-200">{parsedResult.address.addressPath}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </BaseSnapCard>
  );
};
