import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Minus, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { WalletState } from '@/contexts/WalletStateContext';
import { useToast } from '@/components/ui/use-toast';
import { AddressSelector } from './address-selector';

export interface CreateTokenParams {
  name: string;
  symbol: string;
  amount: string;
  change_address: string;
  create_mint: boolean;
  mint_authority_address: string;
  allow_external_mint_authority_address: boolean;
  create_melt: boolean;
  melt_authority_address: string;
  allow_external_melt_authority_address: boolean;
  data: string[];
}

export interface RpcCreateTokenCardProps {
  onExecute: (params: CreateTokenParams) => Promise<any>;
  disabled?: boolean;
  createTokenParams: CreateTokenParams;
  setCreateTokenParams: (params: CreateTokenParams) => void;
  walletState: WalletState;
}

export const RpcCreateTokenCard: React.FC<RpcCreateTokenCardProps> = ({
  onExecute,
  disabled = false,
  createTokenParams,
  setCreateTokenParams,
  walletState,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<{ method: string; params: any } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [requestExpanded, setRequestExpanded] = useState(false);
  const { toast } = useToast();

  // Handler for simple field changes
  const handleFieldChange = (field: keyof CreateTokenParams, value: string | boolean) => {
    setCreateTokenParams({ ...createTokenParams, [field]: value });
  };

  // Handler for data array
  const handleAddData = () => {
    setCreateTokenParams({
      ...createTokenParams,
      data: [...createTokenParams.data, ''],
    });
  };

  const handleRemoveData = (index: number) => {
    const newData = createTokenParams.data.filter((_, i) => i !== index);
    setCreateTokenParams({ ...createTokenParams, data: newData });
  };

  const handleDataChange = (index: number, value: string) => {
    const newData = [...createTokenParams.data];
    newData[index] = value;
    setCreateTokenParams({ ...createTokenParams, data: newData });
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRequestInfo(null);

    try {
      const { request, response } = await onExecute(createTokenParams);

      // Store request and response separately
      setRequestInfo(request);
      setResult(response);
      setRequestExpanded(true);
      setExpanded(true);

      // Log to console
      console.log(`[RPC Request] Create Token`, request);
      console.log(`[RPC Success] Create Token`, response);

      toast({
        title: 'Success',
        description: 'Token created successfully',
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
      console.error(`[RPC Error] Create Token`, {
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
            <h3 className="text-lg font-semibold mb-1">Create Token</h3>
            <p className="text-sm text-gray-400">Create a new custom token with mint/melt authorities</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {/* Basic Token Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Basic Information</Label>
            <Input
              value={createTokenParams.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Token Name (e.g., Test Token)"
              className="bg-gray-900/50 border-gray-700 text-sm"
            />
            <Input
              value={createTokenParams.symbol}
              onChange={(e) => handleFieldChange('symbol', e.target.value)}
              placeholder="Symbol (e.g., TST)"
              className="bg-gray-900/50 border-gray-700 text-sm"
            />
            <Input
              value={createTokenParams.amount}
              onChange={(e) => handleFieldChange('amount', e.target.value)}
              placeholder="Amount (e.g., 100)"
              className="bg-gray-900/50 border-gray-700 text-sm"
            />
          </div>

          {/* Addresses */}
          <div className="space-y-2">
            <AddressSelector
              walletState={walletState}
              value={createTokenParams.change_address}
              onChange={(addr) => handleFieldChange('change_address', addr)}
              label="Change Address (optional)"
              placeholder="Select change address"
              knownOnly={true}
              clearButton={true}
            />
          </div>

          {/* Mint Settings */}
          <div className="space-y-2 bg-gray-800/30 rounded p-3">
            <Label className="text-sm font-medium">Mint Settings</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createTokenParams.create_mint}
                onChange={(e) => handleFieldChange('create_mint', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-300">Create Mint Authority</span>
            </div>
            {createTokenParams.create_mint && (
              <>
                <Input
                  value={createTokenParams.mint_authority_address}
                  onChange={(e) => handleFieldChange('mint_authority_address', e.target.value)}
                  placeholder="Mint Authority Address (optional)"
                  className="bg-gray-900/50 border-gray-700 text-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createTokenParams.allow_external_mint_authority_address}
                    onChange={(e) =>
                      handleFieldChange('allow_external_mint_authority_address', e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-300">Allow External Mint Authority</span>
                </div>
              </>
            )}
          </div>

          {/* Melt Settings */}
          <div className="space-y-2 bg-gray-800/30 rounded p-3">
            <Label className="text-sm font-medium">Melt Settings</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createTokenParams.create_melt}
                onChange={(e) => handleFieldChange('create_melt', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-300">Create Melt Authority</span>
            </div>
            {createTokenParams.create_melt && (
              <>
                <Input
                  value={createTokenParams.melt_authority_address}
                  onChange={(e) => handleFieldChange('melt_authority_address', e.target.value)}
                  placeholder="Melt Authority Address (optional)"
                  className="bg-gray-900/50 border-gray-700 text-sm"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createTokenParams.allow_external_melt_authority_address}
                    onChange={(e) =>
                      handleFieldChange('allow_external_melt_authority_address', e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  <span className="text-sm text-gray-300">Allow External Melt Authority</span>
                </div>
              </>
            )}
          </div>

          {/* Data Array */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Data (optional)</Label>
              <Button
                onClick={handleAddData}
                variant="outline"
                size="sm"
                className="h-7 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Data
              </Button>
            </div>
            {createTokenParams.data.length > 0 && (
              <div className="space-y-2">
                {createTokenParams.data.map((dataItem, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={dataItem}
                      onChange={(e) => handleDataChange(index, e.target.value)}
                      placeholder="Data value"
                      className="bg-gray-900/50 border-gray-700 flex-1 text-sm"
                    />
                    <Button
                      onClick={() => handleRemoveData(index)}
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-gray-400 hover:text-red-400"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
                Creating
              </>
            ) : (
              'Create Token'
            )}
          </Button>
        </div>

        {/* Token Hash Display (if available) */}
        {result && result.hash && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-700/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-400 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              <span>Token Created Successfully</span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-400">Transaction Hash</Label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.hash);
                      toast({ title: 'Copied', description: 'Transaction hash copied to clipboard' });
                    }}
                    className="text-gray-500 hover:text-hathor-yellow-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-xs text-gray-200 break-all">
                  {result.hash}
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
