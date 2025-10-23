import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { SendNanoCreateTokenParams } from './snap-method-handlers';

export interface SendNanoCreateTokenCardProps {
  onExecute: (params: SendNanoCreateTokenParams) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  sendNanoCreateTokenParams: SendNanoCreateTokenParams;
  setSendNanoCreateTokenParams: (params: SendNanoCreateTokenParams) => void;
}

export const SendNanoCreateTokenCard: React.FC<SendNanoCreateTokenCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  sendNanoCreateTokenParams,
  setSendNanoCreateTokenParams,
}) => {
  const [loading, setLoading] = useState(false);

  // Handlers for simple fields
  const handleFieldChange = (field: keyof SendNanoCreateTokenParams, value: any) => {
    setSendNanoCreateTokenParams({ ...sendNanoCreateTokenParams, [field]: value });
  };

  // Build params on execute by parsing JSON where possible
  const buildParamsForExecute = (): SendNanoCreateTokenParams => {
    const built: SendNanoCreateTokenParams = {
      method: sendNanoCreateTokenParams.method,
      address: sendNanoCreateTokenParams.address,
      push_tx: sendNanoCreateTokenParams.push_tx,
    };

    // Parse data field if it's a string
    if (sendNanoCreateTokenParams.data && typeof sendNanoCreateTokenParams.data === 'string') {
      const dataStr = (sendNanoCreateTokenParams.data as string).trim();
      if (dataStr) {
        try {
          built.data = JSON.parse(dataStr);
        } catch {
          // If parsing fails, keep it as string
          built.data = dataStr;
        }
      }
    } else if (sendNanoCreateTokenParams.data) {
      built.data = sendNanoCreateTokenParams.data;
    }

    // Parse createTokenOptions field if it's a string
    if (sendNanoCreateTokenParams.createTokenOptions && typeof sendNanoCreateTokenParams.createTokenOptions === 'string') {
      const createTokenStr = (sendNanoCreateTokenParams.createTokenOptions as string).trim();
      if (createTokenStr) {
        try {
          built.createTokenOptions = JSON.parse(createTokenStr);
        } catch {
          // If parsing fails, keep it as string
          built.createTokenOptions = createTokenStr;
        }
      }
    } else if (sendNanoCreateTokenParams.createTokenOptions) {
      built.createTokenOptions = sendNanoCreateTokenParams.createTokenOptions;
    }

    // Parse options field if it's a string
    if (sendNanoCreateTokenParams.options && typeof sendNanoCreateTokenParams.options === 'string') {
      const optionsStr = (sendNanoCreateTokenParams.options as string).trim();
      if (optionsStr) {
        try {
          built.options = JSON.parse(optionsStr);
        } catch {
          // If parsing fails, keep it as string
          built.options = optionsStr;
        }
      }
    } else if (sendNanoCreateTokenParams.options) {
      built.options = sendNanoCreateTokenParams.options;
    }

    return built;
  };

  return (
    <BaseSnapCard
      title="Create Nano + Token"
      description="Initialize nano contract with token creation"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                const params = buildParamsForExecute();
                await executeWrapper(() => onExecute(params));
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

          <div className="space-y-4 pt-2">
            {/* Basic fields */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Method</Label>
              <Input
                value={sendNanoCreateTokenParams.method}
                onChange={(e) => handleFieldChange('method', e.target.value)}
                placeholder="Method name (e.g., initialize)"
                className="bg-gray-900/50 border-gray-700 text-sm"
                disabled={true /* Method is hardcoded to initialize here */}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Address</Label>
              <Input
                value={sendNanoCreateTokenParams.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="Wallet address"
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
            </div>

            {/* Complex fields as strings */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data (optional, JSON string)</Label>
              <Input
                value={typeof sendNanoCreateTokenParams.data === 'string' ? sendNanoCreateTokenParams.data : JSON.stringify(sendNanoCreateTokenParams.data || '')}
                onChange={(e) => handleFieldChange('data', e.target.value)}
                placeholder='{"blueprint_id": "...", "actions": [], "args": []}'
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Create Token Options (optional, JSON string)</Label>
              <Input
                value={typeof sendNanoCreateTokenParams.createTokenOptions === 'string' ? sendNanoCreateTokenParams.createTokenOptions : JSON.stringify(sendNanoCreateTokenParams.createTokenOptions || '')}
                onChange={(e) => handleFieldChange('createTokenOptions', e.target.value)}
                placeholder='{"name": "Token", "symbol": "TKN", "amount": "100"}'
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Options (optional, JSON string)</Label>
              <Input
                value={typeof sendNanoCreateTokenParams.options === 'string' ? sendNanoCreateTokenParams.options : JSON.stringify(sendNanoCreateTokenParams.options || '')}
                onChange={(e) => handleFieldChange('options', e.target.value)}
                placeholder='{}'
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
            </div>

            {/* Push TX */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Options</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendNanoCreateTokenParams.push_tx}
                  onChange={(e) => handleFieldChange('push_tx', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-300">Push Transaction</span>
              </div>
            </div>
          </div>
        </>
      )}
    </BaseSnapCard>
  );
};
