import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getKnownTokens } from '@/lib/tokenStorage';
import React, { useState, useEffect, useMemo } from 'react';

export interface TokenSelectorProps {
  value: string;
  onChange: (tokenId: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
}

function getTruncatedTokenId(tokenId: string): string {
	if (tokenId.length <= 28) return tokenId;
	return `${tokenId.substring(0, 20)}...${tokenId.substring(tokenId.length - 8)}`;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  value,
  onChange,
  label = 'Token',
  placeholder = 'Enter a token ID or select from known tokens',
  description,
}) => {
  const [mode, setMode] = useState<'known' | 'custom'>('known');
  const [selectedTokenId, setSelectedTokenId] = useState<string>('00');

	// FIXME: This won't update when tokens are added/removed during the component lifecycle
	const knownTokens = useMemo(() => getKnownTokens().sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0)), []);
  const hasKnownTokens = knownTokens.length > 0;

  // Update the value when switching modes or selecting from known tokens
  useEffect(() => {
    if (mode === 'known' && hasKnownTokens) {
      const token = knownTokens.find(t => t.id === selectedTokenId);
      if (token && token.id !== value) {
        onChange(token.id);
      }
    }
  }, [mode, selectedTokenId, hasKnownTokens, value, knownTokens, onChange]);

  // Set initial selectedTokenId if value matches a known token
  useEffect(() => {
    if (mode === 'known' && hasKnownTokens && value) {
      const token = knownTokens.find(t => t.id === value);
      if (token) {
        setSelectedTokenId(token.id);
      }
    }
  }, [value, mode, hasKnownTokens, knownTokens]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'known' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('known')}
          disabled={!hasKnownTokens}
          className="flex-1"
        >
          Known Tokens
        </Button>
        <Button
          type="button"
          variant={mode === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('custom')}
          className="flex-1"
        >
          Custom Token
        </Button>
      </div>

      {mode === 'known' ? (
        <div className="space-y-2">
          {hasKnownTokens ? (
            <>
              <Select
                value={selectedTokenId}
                onValueChange={setSelectedTokenId}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-700">
                  <SelectValue placeholder="Select a token" />
                </SelectTrigger>
                <SelectContent>
                  {knownTokens.map((token) => (
                    <SelectItem key={token.id} value={token.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{token.name} ({token.symbol})</span>
                        <span className="text-xs text-gray-400 font-mono">
                          {`${getTruncatedTokenId(token.id)}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {description && (
                <p className="text-xs text-gray-400">{description}</p>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-400 bg-gray-900/50 border border-gray-700 rounded p-3">
              No known tokens. Tokens will be saved automatically when you interact with them.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="bg-gray-900/50 border-gray-700"
          />
          {description && (
            <p className="text-xs text-gray-400">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};
