import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, Copy } from 'lucide-react';
import { WalletState } from '@/contexts/WalletStateContext';
import { AddressSelector } from './address-selector';

export interface SignOracleDataCardProps {
  onExecute: (ncId: string, data: string, oracle: string) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  walletState: WalletState;
}

export const SignOracleDataCard: React.FC<SignOracleDataCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  walletState,
}) => {
  const [loading, setLoading] = useState(false);
  const [ncId, setNcId] = useState('00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490');
  const [data, setData] = useState('1x0');
  const [oracle, setOracle] = useState('');
  const [parsedResult, setParsedResult] = useState<{
    data: string;
    signedData: {
      type: string;
      signature: string;
      value: string;
    };
    oracle: string;
  } | null>(null);

  const validateNcId = (value: string): boolean => {
    // Must be 64 characters long and hexadecimal
    return /^[0-9a-fA-F]{64}$/.test(value);
  };

  const handleExecute = async () => {
    // Validation
    if (!validateNcId(ncId)) {
      if (onError) {
        onError(new Error('Nano Contract ID must be a 64-character hexadecimal value'));
      }
      return;
    }

    if (!data.trim()) {
      if (onError) {
        onError(new Error('Data cannot be empty'));
      }
      return;
    }

    if (!oracle.trim()) {
      if (onError) {
        onError(new Error('Oracle address cannot be empty'));
      }
      return;
    }

    setLoading(true);
    setParsedResult(null);
    try {
      const result = await onExecute(ncId, data, oracle);

      // Parse the result (type 7 for signOracleData)
      if (result) {
        try {
          const parsed = JSON.parse(result as string);
          if (parsed.type === 7 && parsed.response) {
            setParsedResult(parsed.response);
          }
        } catch (e) {
          console.error('Failed to parse sign oracle data response:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const isNcIdValid = ncId.trim() === '' || validateNcId(ncId);

  return (
    <BaseSnapCard
      title="Sign Oracle Data"
      description="Sign oracle data for nano contract"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              await executeWrapper(handleExecute);
            }}
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
            <AddressSelector
              walletState={walletState}
              value={oracle}
              onChange={setOracle}
              label="Oracle Address"
              placeholder="Enter oracle address"
              description="Select the oracle address that will sign the data"
            />

            {/* Display parsed result */}
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
                    <Label className="text-xs text-gray-400">
                      Signature&nbsp;
                      <button
                        onClick={() => navigator.clipboard.writeText(parsedResult?.signedData.signature)}
                        className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </Label>
                    <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-xs text-gray-200 break-all">
                      {parsedResult.signedData.signature}
                    </div>
                  </div>

                  {/* Oracle Address */}
                  <div>
                    <Label className="text-xs text-gray-400">
                      Oracle Address&nbsp;
                      <button
                        onClick={() => navigator.clipboard.writeText(parsedResult?.oracle)}
                        className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
                        title="Copy to clipboard"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </Label>
                    <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-gray-200 break-all">
                      {parsedResult.oracle}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </BaseSnapCard>
  );
};
