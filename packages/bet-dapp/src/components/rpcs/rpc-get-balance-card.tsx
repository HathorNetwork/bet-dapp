import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, CheckCircle2, XCircle, Plus, Minus, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getKnownTokenIds } from '@/lib/tokenStorage';

export interface RpcGetBalanceCardProps {
  onExecute: () => Promise<any>;
  disabled?: boolean;
  balanceTokens: string[];
  setBalanceTokens: (tokens: string[]) => void;
}

export const RpcGetBalanceCard: React.FC<RpcGetBalanceCardProps> = ({
  onExecute,
  disabled = false,
  balanceTokens,
  setBalanceTokens,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<{ method: string; params: any } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [requestExpanded, setRequestExpanded] = useState(false);
  const { toast } = useToast();

  const handleAddToken = () => {
    setBalanceTokens([...balanceTokens, '']);
  };

  const handleRemoveToken = (index: number) => {
    const newTokens = balanceTokens.filter((_, i) => i !== index);
    setBalanceTokens(newTokens);
  };

  const handleTokenChange = (index: number, value: string) => {
    const newTokens = [...balanceTokens];
    newTokens[index] = value;
    setBalanceTokens(newTokens);
  };

  const handleImportKnownTokens = () => {
    const knownTokenIds = getKnownTokenIds();
    if (knownTokenIds.length > 0) {
      // Merge with existing tokens, avoiding duplicates
      const existingTokens = new Set(balanceTokens.filter(t => t.trim() !== ''));
      const newTokens = knownTokenIds.filter(id => !existingTokens.has(id));

      if (newTokens.length > 0) {
        setBalanceTokens([...balanceTokens.filter(t => t.trim() !== ''), ...newTokens]);
      }
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const filteredTokens = balanceTokens.filter(token => token.trim() !== '');

    // Capture request info for display
    const reqInfo = {
      method: 'htr_getBalance',
      params: { tokens: filteredTokens },
    };
    setRequestInfo(reqInfo);
    setRequestExpanded(true);

    // Log request to console
    console.log(`[RPC Request] Get Balance`, reqInfo);

    try {
      const data = await onExecute();
      setResult(data);
      setExpanded(true);

      // Log success to console
      console.log(`[RPC Success] Get Balance`, data);

      toast({
        title: 'Success',
        description: 'Get Balance executed successfully',
      });
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      setExpanded(true);

      // Log full error to console for debugging
      console.error(`[RPC Error] Get Balance`, {
        message: errorMessage,
        error: err,
        request: reqInfo,
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

  const knownTokenIds = getKnownTokenIds();
  const availableToImport = knownTokenIds.filter(
    id => !balanceTokens.includes(id)
  ).length;

  const hasResult = result !== null || error !== null;

  // Render result
  const renderResult = () => {
    if (!result) return null;

    try {
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

      if (Array.isArray(parsedResult)) {
        return (
          <div className="bg-gray-900/50 border border-gray-700 p-3 rounded overflow-auto max-h-64">
            <pre className="text-sm font-mono">
              {JSON.stringify(parsedResult, null, 2)}
            </pre>
          </div>
        );
      }

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
            <h3 className="text-lg font-semibold mb-1">Get Balance</h3>
            <p className="text-sm text-gray-400">[📱 Mobile Wallet Only] Get balances for specified tokens</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Token IDs</Label>
            <div className="flex gap-2">
              <Button
                onClick={handleImportKnownTokens}
                variant="outline"
                size="sm"
                className="h-7 px-2"
              >
                <Download className="h-3 w-3 mr-1" />
                Import Known
                {availableToImport > 0 && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({availableToImport} available)
                  </span>
                )}
              </Button>
              <Button
                onClick={handleAddToken}
                variant="outline"
                size="sm"
                className="h-7 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Token
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {balanceTokens.map((token, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={token}
                  onChange={(e) => handleTokenChange(index, e.target.value)}
                  placeholder="Token ID (e.g., 00 for HTR)"
                  className="bg-gray-900/50 border-gray-700 flex-1"
                />
                {balanceTokens.length > 1 && (
                  <Button
                    onClick={() => handleRemoveToken(index)}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-gray-400 hover:text-red-400"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
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
              Loading
            </>
          ) : (
            'Execute'
          )}
        </Button>

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

        {hasResult && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm font-medium text-hathor-yellow-500 hover:text-hathor-yellow-400 flex items-center"
              >
                {expanded ? '▼' : '▶'} {error ? 'Error Details' : 'Result'}
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
