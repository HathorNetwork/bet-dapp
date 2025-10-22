import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useMetaMaskContext } from 'snap-utils';

export interface BaseSnapCardProps {
  title: string;
  description: string;
  onError?: (error: any) => void;
  children: (executeWrapper: ExecuteWrapperFn) => React.ReactNode;
}

export type ExecuteWrapperFn = <T>(
  executeFn: () => Promise<T>,
  options?: {
    successMessage?: string;
    onSuccess?: (result: T) => void;
  }
) => Promise<void>;

export const BaseSnapCard: React.FC<BaseSnapCardProps> = ({
  title,
  description,
  onError,
  children,
}) => {
  const { error: metamaskContextError } = useMetaMaskContext();
  const [result, setResult] = useState<any>(null);
  const [expectingErrorResult, setExpectingErrorResult] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  /**
   * Effect to handle errors coming from MetaMask context
   */
  useEffect(() => {
    if (expectingErrorResult && metamaskContextError) {
      setError(metamaskContextError.message || 'An error occurred');
      setExpectingErrorResult(false);
    }
  }, [expectingErrorResult, metamaskContextError]);

  const executeWrapper: ExecuteWrapperFn = async (executeFn, options = {}) => {
    setError(null);
    setResult(null);

    try {
      const data = await executeFn();
      if (!data) {
        setExpectingErrorResult(true);
        setError('An error occurred');
        return; // The error will soon be available in the metamask context
      }
      setError(null);
      setResult(data);
      setExpanded(true);

      if (options.onSuccess) {
        options.onSuccess(data);
      }

      toast({
        title: 'Success',
        description: options.successMessage || `${title} executed successfully`,
      });
    } catch (err: any) {
			console.warn(`[BaseSnapCard] executeWrapper error on ${title}`, err);
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      setExpanded(true);

      // Notify parent about the error
      if (onError) {
        onError(err);
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
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

  // Render prettified result with each top-level property in its own section
  const renderResult = () => {
    if (!result) return null;

    const parsedResult = JSON.parse(result);

    // Handle primitive values (string, number, boolean, null)
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

    // Handle objects - display each top-level property in its own section
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
        {entries.map(([key, value]) => {
          // Render value properties
          const renderValue = () => {
            // Primitive values
            if (typeof value !== 'object' || value === null) {
              return (
                <div className="px-3 py-2 text-sm font-mono text-gray-300 break-all">
                  {String(value)}
                </div>
              );
            }

            // Arrays
            if (Array.isArray(value)) {
              if (value.length === 0) {
                return <div className="px-3 py-2 text-sm text-gray-400 italic">Empty array</div>;
              }

              return (
                <div className="divide-y divide-gray-700/50">
                  {value.map((item, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-start gap-3">
                      <span className="text-gray-500 text-sm flex-shrink-0">[{idx}]</span>
                      <span className="text-sm font-mono text-gray-300 break-all flex-1 overflow-x-auto">
                        {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }

            // Objects - show each property on its own line
            const valueEntries = Object.entries(value);

            if (valueEntries.length === 0) {
              return <div className="px-3 py-2 text-sm text-gray-400 italic">Empty object</div>;
            }

            return (
              <div className="divide-y divide-gray-700/50">
                {valueEntries.map(([propKey, propValue]) => (
                  <div key={propKey} className="px-3 py-2 flex items-start gap-3">
                    <span className="text-gray-400 text-sm font-medium flex-shrink-0 min-w-[80px]">
                      {propKey}:
                    </span>
                    <span className="text-sm font-mono text-gray-300 break-all flex-1 overflow-x-auto">
                      {typeof propValue === 'object'
                        ? JSON.stringify(propValue)
                        : String(propValue)
                      }
                    </span>
                  </div>
                ))}
              </div>
            );
          };

          return (
            <div key={key} className="bg-gray-900/50 border border-gray-700 rounded overflow-hidden">
              <div className="bg-gray-800/50 px-3 py-2 border-b border-gray-700">
                <span className="text-sm font-semibold text-hathor-yellow-500 break-all">
                  {key}
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {renderValue()}
              </div>
            </div>
          );
        })}
      </div>
    );
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

        {children(executeWrapper)}

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
