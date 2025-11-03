import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Copy, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { WalletState } from '@/contexts/WalletStateContext';

export interface RpcSignOracleDataCardProps {
  onExecute: (ncId: string, data: string, oracle: string) => Promise<any>;
  disabled?: boolean;
  walletState: WalletState;
  isDryRun?: boolean;
}

export const RpcSignOracleDataCard: React.FC<RpcSignOracleDataCardProps> = ({
  onExecute,
  disabled = false,
  walletState,
  isDryRun = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<{ method: string; params: any } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [requestExpanded, setRequestExpanded] = useState(false);
  const { toast } = useToast();

  const [ncId, setNcId] = useState('00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490');
  const [data, setData] = useState('1x0');
  const [oracleMode, setOracleMode] = useState<'known' | 'custom'>('known');
  const [selectedKnownOracle, setSelectedKnownOracle] = useState<string>('');
  const [customOracle, setCustomOracle] = useState('');
  const [parsedResult, setParsedResult] = useState<{
    data: string;
    signedData: {
      type: string;
      signature: string;
      value: string;
    };
    oracle: string;
  } | null>(null);

  const knownAddresses = Array.from(walletState.addresses.values()).sort((a, b) => a.index - b.index);
  const hasKnownAddresses = knownAddresses.length > 0;

  // Set default oracle to first known address if available
  React.useEffect(() => {
    if (hasKnownAddresses && !selectedKnownOracle && knownAddresses[0]) {
      setSelectedKnownOracle(knownAddresses[0].address);
    }
  }, [hasKnownAddresses, knownAddresses, selectedKnownOracle]);

  const validateNcId = (value: string): boolean => {
    // Must be 64 characters long and hexadecimal
    return /^[0-9a-fA-F]{64}$/.test(value);
  };

  const handleExecute = async () => {
    // Validation
    if (!validateNcId(ncId)) {
      const errorMsg = 'Nano Contract ID must be a 64-character hexadecimal value';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    if (!data.trim()) {
      const errorMsg = 'Data cannot be empty';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    const oracle = oracleMode === 'known' ? selectedKnownOracle : customOracle;
    if (!oracle.trim()) {
      const errorMsg = 'Oracle address cannot be empty';
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
      const { request, response } = await onExecute(ncId, data, oracle);

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
          if (parsed.data && parsed.signedData && parsed.oracle) {
            setParsedResult(parsed);
          }
        } catch (e) {
          console.error('Failed to parse sign oracle data response:', e);
        }
      }

      // Log to console
      console.log(`[RPC Request] Sign Oracle Data`, request);
      console.log(`[RPC Success] Sign Oracle Data`, response);

      toast({
        title: isDryRun ? 'Dry Run Complete' : 'Success',
        description: isDryRun ? 'Request generated (not sent to RPC)' : 'Oracle data signed successfully',
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
      console.error(`[RPC Error] Sign Oracle Data`, {
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
  const isNcIdValid = ncId.trim() === '' || validateNcId(ncId);

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
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold">Sign Oracle Data</h3>
              {isDryRun && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-900/30 text-purple-400 border border-purple-500/30">
                  <FlaskConical className="h-3 w-3" />
                  DRY RUN
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">Sign oracle data for nano contract</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* Nano Contract ID Input */}
          <div className="space-y-2">
            <Label htmlFor="nc_id" className="text-sm font-medium">
              Nano Contract ID
            </Label>
            <Input
              id="nc_id"
              value={ncId}
              onChange={(e) => setNcId(e.target.value)}
              placeholder="64-character hexadecimal value"
              className={`bg-gray-900/50 border-gray-700 font-mono ${!isNcIdValid ? 'border-red-500' : ''}`}
            />
            {!isNcIdValid && (
              <p className="text-xs text-red-400">
                Must be a 64-character hexadecimal value
              </p>
            )}
            {isNcIdValid && ncId.trim() !== '' && (
              <p className="text-xs text-gray-400">
                Valid nano contract ID
              </p>
            )}
          </div>

          {/* Data Input */}
          <div className="space-y-2">
            <Label htmlFor="data" className="text-sm font-medium">
              Data
            </Label>
            <Textarea
              id="data"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="Enter the data to sign..."
              className="bg-gray-900/50 border-gray-700 min-h-[80px]"
            />
            <p className="text-xs text-gray-400">
              Any string value to be signed by the oracle
            </p>
          </div>

          {/* Oracle Address Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Oracle Address</Label>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={oracleMode === 'known' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOracleMode('known')}
                disabled={!hasKnownAddresses}
                className="flex-1"
              >
                Known Address
              </Button>
              <Button
                type="button"
                variant={oracleMode === 'custom' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOracleMode('custom')}
                className="flex-1"
              >
                Custom
              </Button>
            </div>

            {oracleMode === 'known' ? (
              <div className="space-y-2">
                {hasKnownAddresses ? (
                  <>
                    <Select
                      value={selectedKnownOracle}
                      onValueChange={setSelectedKnownOracle}
                    >
                      <SelectTrigger className="bg-gray-900/50 border-gray-700">
                        <SelectValue placeholder="Select oracle address" />
                      </SelectTrigger>
                      <SelectContent>
                        {knownAddresses.map((addr) => (
                          <SelectItem key={addr.index} value={addr.address}>
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
                    No known addresses available. Please use custom mode or generate addresses first.
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={customOracle}
                  onChange={(e) => setCustomOracle(e.target.value)}
                  placeholder="Enter oracle address"
                  className="bg-gray-900/50 border-gray-700 font-mono"
                />
                <p className="text-xs text-gray-400">
                  Enter the oracle address that will sign the data
                </p>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleExecute}
          disabled={loading || disabled || !isNcIdValid}
          className="ml-auto flex-shrink-0"
          size="sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing
            </>
          ) : (
            'Sign Oracle Data'
          )}
        </Button>

        {/* Formatted Result Display (if parsed successfully) */}
        {parsedResult && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-700/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-400 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              <span>Oracle Data Signed Successfully</span>
            </div>

            <div className="space-y-3 text-sm">
              {/* Data */}
              <div>
                <Label className="text-xs text-gray-400">Data</Label>
                <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-gray-200 break-words">
                  {parsedResult.data}
                </div>
              </div>

              {/* Signature */}
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-400">Signature</Label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(parsedResult.signedData.signature);
                      toast({ title: 'Copied', description: 'Signature copied to clipboard' });
                    }}
                    className="text-gray-500 hover:text-hathor-yellow-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-xs text-gray-200 break-all">
                  {parsedResult.signedData.signature}
                </div>
              </div>

              {/* Oracle Address */}
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-400">Oracle Address</Label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(parsedResult.oracle);
                      toast({ title: 'Copied', description: 'Oracle address copied to clipboard' });
                    }}
                    className="text-gray-500 hover:text-hathor-yellow-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-gray-200 break-all">
                  {parsedResult.oracle}
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
                {isDryRun && result === null ? (
                  <div className="bg-purple-900/20 border border-purple-500/50 rounded p-3">
                    <div className="flex items-center gap-2 text-purple-400">
                      <FlaskConical className="h-4 w-4" />
                      <span className="text-sm font-medium">Dry Run Mode</span>
                    </div>
                    <p className="text-sm text-purple-300 mt-2">
                      The request was generated but not sent to the RPC. Check the Request section above to see the parameters that would be sent.
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

