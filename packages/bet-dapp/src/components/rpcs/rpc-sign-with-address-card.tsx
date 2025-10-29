import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { WalletState } from '@/contexts/WalletStateContext';

export interface RpcSignWithAddressCardProps {
  onExecute: (message: string, addressIndex: number) => Promise<any>;
  disabled?: boolean;
  walletState: WalletState;
}

export const RpcSignWithAddressCard: React.FC<RpcSignWithAddressCardProps> = ({
  onExecute,
  disabled = false,
  walletState,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<{ method: string; params: any } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [requestExpanded, setRequestExpanded] = useState(false);
  const { toast } = useToast();

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
      const errorMsg = 'Address index must be a valid non-negative number';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      const errorMsg = 'Message cannot be empty';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setParsedResult(null);
    setRequestInfo(null);

    try {
      const { request, response } = await onExecute(message, addressIndex);

      // Store request and response separately
      setRequestInfo(request);
      setResult(response);
      setRequestExpanded(true);
      setExpanded(true);

      // Parse the result for formatted display
      if (response) {
        try {
          const parsed = typeof response === 'string' ? JSON.parse(response) : response;
          // Check if it has the expected structure
          if (parsed.message && parsed.signature && parsed.address) {
            setParsedResult(parsed);
          }
        } catch (e) {
          console.error('Failed to parse sign with address response:', e);
        }
      }

      // Log to console
      console.log(`[RPC Request] Sign with Address`, request);
      console.log(`[RPC Success] Sign with Address`, response);

      toast({
        title: 'Success',
        description: 'Message signed successfully',
      });
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      setExpanded(true);

      // Capture request params from error if available
      if (err.requestParams) {
        setRequestInfo(err.requestParams);
        setRequestExpanded(true);
      }

      // Log full error to console for debugging
      console.error(`[RPC Error] Sign with Address`, {
        message: errorMessage,
        error: err,
        requestParams: err.requestParams,
      });

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const hasResult = result !== null || error !== null;

  // Render result (raw JSON)
  const renderResult = () => {
    if (!result) return null;

    try {
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

      const entries = Object.entries(parsedResult);
      return (
        <div className="space-y-3">
          {entries.map(([key, value]) => (
            <div key={key} className="bg-gray-900/50 border border-gray-700 rounded overflow-hidden">
              <div className="bg-gray-800/50 px-3 py-2 border-b border-gray-700">
                <span className="text-sm font-semibold text-hathor-yellow-500 break-all">
                  {key}
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto px-3 py-2">
                <span className="text-sm font-mono text-gray-300 break-all">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </span>
              </div>
            </div>
          ))}
        </div>
      );
    } catch (e) {
      return (
        <div className="bg-gray-900/50 border border-gray-700 p-3 rounded overflow-auto max-h-64">
          <pre className="text-sm font-mono text-gray-300">
            {String(result)}
          </pre>
        </div>
      );
    }
  };

  return (
    <Card className={`p-4 transition-colors ${
      error
        ? 'border-red-500/50 hover:border-red-500/70'
        : 'hover:border-hathor-yellow-500/50'
    }`}>
      <div className="flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Sign with Address</h3>
            <p className="text-sm text-gray-400">Sign a message using a specific address</p>
          </div>
        </div>

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
                    No known addresses. Please retrieve addresses first using &quot;Get Wallet Information&quot;.
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

        <Button
          onClick={handleExecute}
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

        {/* Formatted Result Display (if parsed successfully) */}
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
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-400">Signature</Label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(parsedResult.signature);
                      toast({ title: 'Copied', description: 'Signature copied to clipboard' });
                    }}
                    className="text-gray-500 hover:text-hathor-yellow-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-xs text-gray-200 break-all">
                  {parsedResult.signature}
                </div>
              </div>

              {/* Address Details */}
              <div>
                <Label className="text-xs text-gray-400">Signed with Address</Label>
                <div className="mt-1 space-y-2">
                  <div className="p-2 bg-gray-900/50 rounded border border-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-400">Address</div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(parsedResult.address.address);
                          toast({ title: 'Copied', description: 'Address copied to clipboard' });
                        }}
                        className="text-gray-500 hover:text-hathor-yellow-400 transition-colors"
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

        {/* Request Info Section - Blue */}
        {requestInfo && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setRequestExpanded(!requestExpanded)}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center"
              >
                {requestExpanded ? '▼' : '▶'} Request
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(requestInfo, null, 2));
                  toast({
                    title: 'Copied',
                    description: 'Request copied to clipboard',
                  });
                }}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {requestExpanded && (
              <div className="bg-blue-900/20 border border-blue-500/50 rounded p-3">
                <div className="space-y-2">
                  <div className="bg-blue-950/30 border border-blue-500/30 rounded overflow-hidden">
                    <div className="bg-blue-900/30 px-3 py-2 border-b border-blue-500/30">
                      <span className="text-sm font-semibold text-blue-400">method</span>
                    </div>
                    <div className="px-3 py-2">
                      <span className="text-sm font-mono text-blue-300">{requestInfo.method}</span>
                    </div>
                  </div>
                  <div className="bg-blue-950/30 border border-blue-500/30 rounded overflow-hidden">
                    <div className="bg-blue-900/30 px-3 py-2 border-b border-blue-500/30">
                      <span className="text-sm font-semibold text-blue-400">params</span>
                    </div>
                    <div className="px-3 py-2 max-h-64 overflow-y-auto">
                      <pre className="text-sm font-mono text-blue-300">
                        {JSON.stringify(requestInfo.params, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Raw Result Section - Yellow */}
        {hasResult && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm font-medium text-hathor-yellow-500 hover:text-hathor-yellow-400 flex items-center"
              >
                {expanded ? '▼' : '▶'} {error ? 'Error Details' : 'Raw Result'}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const textToCopy = result ? JSON.stringify(result, null, 2) : error || '';
                  navigator.clipboard.writeText(textToCopy);
                  toast({
                    title: 'Copied',
                    description: 'Result copied to clipboard',
                  });
                }}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            {expanded && (
              <div className="relative">
                {error ? (
                  <div className="flex items-start space-x-2 p-3 bg-red-900/20 border border-red-500/50 rounded">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400 break-words">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-green-500">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Success</span>
                    </div>
                    {renderResult()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
