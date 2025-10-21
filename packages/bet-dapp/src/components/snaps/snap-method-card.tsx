import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Copy, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export interface SnapMethodCardProps {
  title: string;
  description: string;
  onExecute: () => Promise<any>;
  buttonLabel?: string;
}

export const SnapMethodCard: React.FC<SnapMethodCardProps> = ({
  title,
  description,
  onExecute,
  buttonLabel = 'Execute',
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await onExecute();
      setResult(data);
      setExpanded(true);
      toast({
        title: 'Success',
        description: `${title} executed successfully`,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      setExpanded(true);
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

  return (
    <Card className="p-4 hover:border-hathor-yellow-500/50 transition-colors">
      <div className="flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
          </div>
          <Button
            onClick={handleExecute}
            disabled={loading}
            className="ml-4 flex-shrink-0"
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
        </div>

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
                    <pre className="bg-gray-900/50 border border-gray-700 p-3 rounded overflow-auto text-sm max-h-64">
                      {JSON.stringify(result, null, 2)}
                    </pre>
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