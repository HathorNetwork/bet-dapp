import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { TESTNET_INDIA_EXPLORER_BASE_URL } from '@/components/snaps/constants';
import { AddressSelector } from './address-selector';
import { TokenSelector } from './token-selector';
import { useWalletState } from '@/contexts/WalletStateContext';
import { useToast } from '@/components/ui/use-toast';

export interface BetParams {
  ncId: string;
  betChoice: string;
  amount: number;
  address: string;
  token: string;
  push_tx: boolean;
}

export interface RpcBetCardProps {
  onExecute: (params: BetParams) => Promise<any>;
  disabled?: boolean;
  betParams: BetParams;
  setBetParams: (params: BetParams) => void;
}

export const RpcBetCard: React.FC<RpcBetCardProps> = ({
  onExecute,
  disabled = false,
  betParams,
  setBetParams,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<{ method: string; params: any } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [requestExpanded, setRequestExpanded] = useState(false);
  const { toast } = useToast();
  const { walletState } = useWalletState();

  // Handlers for simple fields
  const handleFieldChange = (field: keyof BetParams, value: any) => {
    setBetParams({ ...betParams, [field]: value });
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRequestInfo(null);

    try {
      const ncId = walletState.betNanoContract?.ncId || '';
      const { request, response } = await onExecute({ ...betParams, ncId });

      // Store request and response separately
      setRequestInfo(request);
      setResult(response);
      setRequestExpanded(true);
      setExpanded(true);

      // Log to console
      console.log(`[RPC Request] Place Bet`, request);
      console.log(`[RPC Success] Place Bet`, response);

      toast({
        title: 'Success',
        description: 'Bet placed successfully',
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
      console.error(`[RPC Error] Place Bet`, {
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
            <h3 className="text-lg font-semibold mb-1">Place Bet</h3>
            <p className="text-sm text-gray-400">Place a bet on an existing bet nano contract</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
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

        <div className="flex gap-2 ml-auto">
          <Button
            onClick={handleExecute}
            disabled={loading || disabled}
            className="flex-shrink-0"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Placing Bet
              </>
            ) : (
              'Place Bet'
            )}
          </Button>
        </div>

        {/* Transaction Hash Display (if available) */}
        {result?.response?.hash && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-700/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-400 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              <span>Bet Placed Successfully</span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-400">Transaction Hash</Label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.response?.hash);
                      toast({ title: 'Copied', description: 'Transaction hash copied to clipboard' });
                    }}
                    className="text-gray-500 hover:text-hathor-yellow-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-xs text-gray-200 break-all">
                  {result.response?.hash}
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
              <div className="flex items-center gap-1">
                {result?.response?.hash && (
                  <a
                    href={`${TESTNET_INDIA_EXPLORER_BASE_URL}/transaction/${result.response?.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in Explorer"
                    className="h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-800 rounded transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-gray-400 hover:text-hathor-yellow-400" />
                  </a>
                )}
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
            </div>

            {expanded && (
              <div className="relative">
                {error ? (
                  <div className="flex items-start space-x-2 p-3 bg-red-900/20 border border-red-500/50 rounded">
                    <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-200 mb-1">Error occurred</p>
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-hathor-yellow-900/20 border border-hathor-yellow-500/50 rounded">
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
