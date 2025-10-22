import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { TokenSelector } from './token-selector';
import React, { useState } from 'react';

export interface GetUtxosCardProps {
  onExecute: (tokenId: string) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export const GetUtxosCard: React.FC<GetUtxosCardProps> = ({
  onExecute,
  onError,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [tokenId, setTokenId] = useState('00');

  const handleExecute = async () => {
    setLoading(true);
    try {
      return await onExecute(tokenId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseSnapCard
      title="Get UTXOs"
      description="Retrieve unspent transaction outputs"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              await executeWrapper(handleExecute);
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

          <div className="pt-2">
            <TokenSelector
              value={tokenId}
              onChange={setTokenId}
              label="Token ID"
              placeholder="Enter token ID or select from known tokens"
              description="Token to filter UTXOs by"
            />
          </div>
        </>
      )}
    </BaseSnapCard>
  );
};
