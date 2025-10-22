import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Minus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface CreateTokenParams {
  name: string;
  symbol: string;
  amount: string;
  address: string;
  change_address: string;
  create_mint: boolean;
  mint_authority_address: string;
  allow_external_mint_authority_address: boolean;
  create_melt: boolean;
  melt_authority_address: string;
  allow_external_melt_authority_address: boolean;
  push_tx: boolean;
  data: string[];
}

export interface CreateTokenCardProps {
  onExecute: (params: CreateTokenParams) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  createTokenParams: CreateTokenParams;
  setCreateTokenParams: (params: CreateTokenParams) => void;
}

export const CreateTokenCard: React.FC<CreateTokenCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  createTokenParams,
  setCreateTokenParams,
}) => {
  const [loading, setLoading] = useState(false);

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

  return (
    <BaseSnapCard
      title="Create Token"
      description="Create a new custom token with mint/melt authorities"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <Button
            onClick={async () => {
              setLoading(true);
              try {
                await executeWrapper(() => onExecute(createTokenParams));
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
              <Label className="text-sm font-medium">Addresses (optional)</Label>
              <Input
                value={createTokenParams.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                placeholder="Destination Address"
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
              <Input
                value={createTokenParams.change_address}
                onChange={(e) => handleFieldChange('change_address', e.target.value)}
                placeholder="Change Address"
                className="bg-gray-900/50 border-gray-700 text-sm"
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
                    placeholder="Mint Authority Address"
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
                    placeholder="Melt Authority Address"
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

            {/* Other Settings */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Other Settings</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={createTokenParams.push_tx}
                  onChange={(e) => handleFieldChange('push_tx', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-gray-300">Push Transaction</span>
              </div>
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
        </>
      )}
    </BaseSnapCard>
  );
};
