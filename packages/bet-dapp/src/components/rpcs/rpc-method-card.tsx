import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export interface RpcMethodInput {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
}

export interface RpcMethodCardProps {
  title: string;
  description: string;
  onExecute?: (inputValues?: Record<string, string>) => Promise<any>;
  buttonLabel?: string;
  inputs?: RpcMethodInput[];
  disabled?: boolean;
  method?: string; // RPC method name for display
  params?: any; // RPC params for display
}

export const RpcMethodCard: React.FC<RpcMethodCardProps> = ({
  title,
  description,
  onExecute,
  buttonLabel = 'Execute',
  inputs = [],
  disabled = false,
  method,
  params,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<{ method: string; params: any } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [requestExpanded, setRequestExpanded] = useState(false);
  const { toast } = useToast();

  // Initialize input values with default values
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    inputs.forEach(input => {
      initial[input.name] = input.defaultValue;
    });
    return initial;
  });

  const handleInputChange = (name: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExecute = async () => {
    if (!onExecute) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Capture request info for display
    const reqInfo = {
      method: method || 'Unknown Method',
      params: params || inputValues,
    };
    setRequestInfo(reqInfo);
    setRequestExpanded(true);

    // Log request to console
    console.log(`[RPC Request] ${title}`, reqInfo);

    try {
      const data = await onExecute(inputValues);
      setResult(data);
      setExpanded(true);

      // Log success to console
      console.log(`[RPC Success] ${title}`, data);

      toast({
        title: 'Success',
        description: `${title} executed successfully`,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      setExpanded(true);

      // Log full error to console for debugging
      console.error(`[RPC Error] ${title}`, {
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

  const handleCopy = () => {
    const textToCopy = result ? JSON.stringify(result, null, 2) : error || '';
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: 'Copied',
      description: 'Result copied to clipboard',
    });
  };

  const hasResult = result !== null || error !== null;

  // Render prettified result
  const renderResult = () => {
    if (!result) return null;

    try {
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

      // Handle primitive values
      if (typeof parsedResult !== 'object' || parsedResult === null) {
        return (
          <div className="bg-gray-900/50 border border-gray-700 p-3 rounded">
            <div className="text-sm font-mono text-hathor-yellow-400">
              {String(parsedResult)}
            </div>
          </div>
        );
      }

      // Handle arrays
      if (Array.isArray(parsedResult)) {
        return (
          <div className="bg-gray-900/50 border border-gray-700 p-3 rounded overflow-auto max-h-64">
            <pre className="text-sm font-mono">
              {JSON.stringify(parsedResult, null, 2)}
            </pre>
          </div>
        );
      }

      // Handle objects
      const entries = Object.entries(parsedResult);

      if (entries.length === 0) {
        return (
          <div className="bg-gray-900/50 border border-gray-700 p-3 rounded">
            <div className="text-sm text-gray-400 italic">Empty object</div>
          </div>
        );
      }

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
      // If parsing fails, just show as string
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
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
        </div>

        {inputs.length > 0 && (
          <div className="grid gap-3 pt-2">
            {inputs.map(input => (
              <div key={input.name} className="grid gap-2">
                <Label htmlFor={input.name} className="text-sm font-medium">
                  {input.label}
                </Label>
                <Input
                  id={input.name}
                  value={inputValues[input.name] || ''}
                  onChange={(e) => handleInputChange(input.name, e.target.value)}
                  placeholder={input.placeholder}
                  className="bg-gray-900/50 border-gray-700"
                />
              </div>
            ))}
          </div>
        )}

        {onExecute && (
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
              buttonLabel
            )}
          </Button>
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
                onClick={handleCopy}
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
