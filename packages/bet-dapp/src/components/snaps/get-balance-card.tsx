import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Minus, Download } from 'lucide-react';
import { getKnownTokenIds } from '@/lib/tokenStorage';

export interface GetBalanceCardProps {
  onExecute: () => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  balanceTokens: string[];
  setBalanceTokens: (tokens: string[]) => void;
}

export const GetBalanceCard: React.FC<GetBalanceCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  balanceTokens,
  setBalanceTokens,
}) => {
  const [loading, setLoading] = useState(false);

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

  const knownTokenIds = getKnownTokenIds();
  const availableToImport = knownTokenIds.filter(
    id => !balanceTokens.includes(id)
  ).length;

  return (
    <BaseSnapCard
      title="Get Balance"
      description="Get balances for specified tokens"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                await executeWrapper(onExecute);
              } finally {
                setLoading(false);
              }
            }}
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
        </>
      )}
    </BaseSnapCard>
  );
};
