import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Minus, ArrowRightLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WalletState } from '@/contexts/WalletStateContext';

export interface Output {
  type: 'address' | 'data';
  // For address outputs
  address?: string;
  value?: string;
  token?: string;
  // For data outputs
  dataType?: string;
  data?: string;
}

export interface Input {
  txId: string;
  index: string;
}

export interface SendTxParams {
  outputs: Output[];
  inputs: Input[];
  changeAddress: string;
}

export interface SendTxCardProps {
  onExecute: (params: SendTxParams) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  sendTxParams: SendTxParams;
  setSendTxParams: (params: SendTxParams) => void;
  walletState: WalletState;
}

export const SendTxCard: React.FC<SendTxCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  sendTxParams,
  setSendTxParams,
  walletState,
}) => {
  const [loading, setLoading] = useState(false);

  // Output handlers
  const handleAddOutput = () => {
    setSendTxParams({
      ...sendTxParams,
      outputs: [...sendTxParams.outputs, { type: 'address', address: '', value: '', token: '' }],
    });
  };

  const handleRemoveOutput = (index: number) => {
    const newOutputs = sendTxParams.outputs.filter((_, i) => i !== index);
    setSendTxParams({ ...sendTxParams, outputs: newOutputs });
  };

  const handleOutputTypeChange = (index: number, type: 'address' | 'data') => {
    const newOutputs = [...sendTxParams.outputs];
    if (type === 'address') {
      newOutputs[index] = { type: 'address', address: '', value: '', token: '' };
    } else {
      newOutputs[index] = { type: 'data', dataType: '', data: '' };
    }
    setSendTxParams({ ...sendTxParams, outputs: newOutputs });
  };

  const handleOutputChange = (index: number, field: string, value: string) => {
    const newOutputs = [...sendTxParams.outputs];
    newOutputs[index] = { ...newOutputs[index], [field]: value };
    setSendTxParams({ ...sendTxParams, outputs: newOutputs });
  };

  // Input handlers
  const handleAddInput = () => {
    setSendTxParams({
      ...sendTxParams,
      inputs: [...sendTxParams.inputs, { txId: '', index: '' }],
    });
  };

  const handleRemoveInput = (index: number) => {
    const newInputs = sendTxParams.inputs.filter((_, i) => i !== index);
    setSendTxParams({ ...sendTxParams, inputs: newInputs });
  };

  const handleInputChange = (index: number, field: string, value: string) => {
    const newInputs = [...sendTxParams.inputs];
    newInputs[index] = { ...newInputs[index], [field]: value };
    setSendTxParams({ ...sendTxParams, inputs: newInputs });
  };

  // Change address handler
  const handleChangeAddressChange = (value: string) => {
    setSendTxParams({ ...sendTxParams, changeAddress: value });
  };

  // Helper function: Move UTXO Around
  const handleMoveUtxoAround = () => {
    // Get the first available UTXO
    const firstUtxo = walletState.utxos.length > 0 ? walletState.utxos[0] : null;

    if (!firstUtxo) {
      // No UTXOs available
      if (onError) {
        onError({ message: 'No UTXOs available in wallet state' });
      }
      return;
    }

    // Try to find a different address than the UTXO's address
    let targetAddress = firstUtxo.address;
    const addresses = Array.from(walletState.addresses.values());
    const differentAddress = addresses.find(addr => addr.address !== firstUtxo.address);
    if (differentAddress) {
      targetAddress = differentAddress.address;
    }

    // Build the new params
    const newParams: SendTxParams = {
      outputs: [
        {
          type: 'address',
          address: targetAddress,
          value: firstUtxo.value,
          token: firstUtxo.token === '00' ? '' : firstUtxo.token, // Empty string for HTR, otherwise use token
        },
      ],
      inputs: [
        {
          txId: firstUtxo.txId,
          index: String(firstUtxo.index),
        },
      ],
      changeAddress: '',
    };

    setSendTxParams(newParams);
  };

  return (
    <BaseSnapCard
      title="Send Transaction"
      description="Send a transaction with custom outputs and inputs"
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          <div className="flex gap-2 ml-auto">
            <Button
              onClick={handleMoveUtxoAround}
              disabled={loading || disabled || walletState.utxos.length === 0}
              variant="outline"
              size="sm"
              title="Auto-fill form using first available UTXO"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Move UTXO Around
            </Button>
            <Button
              onClick={async () => {
                setLoading(true);
                try {
                  await executeWrapper(() => onExecute(sendTxParams));
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || disabled}
              className="flex-shrink-0"
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
          </div>

          <div className="space-y-4 pt-2">
            {/* Outputs Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Outputs</Label>
                <Button
                  onClick={handleAddOutput}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Output
                </Button>
              </div>
              <div className="space-y-3">
                {sendTxParams.outputs.map((output, index) => (
                  <div
                    key={index}
                    className="bg-gray-900/50 border border-gray-700 rounded p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={output.type}
                        onValueChange={(value: 'address' | 'data') =>
                          handleOutputTypeChange(index, value)
                        }
                      >
                        <SelectTrigger className="bg-gray-900/50 border-gray-700 h-8 text-sm">
                          <SelectValue placeholder="Output type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="address">Address Output</SelectItem>
                          <SelectItem value="data">Data Output</SelectItem>
                        </SelectContent>
                      </Select>
                      {sendTxParams.outputs.length > 1 && (
                        <Button
                          onClick={() => handleRemoveOutput(index)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {output.type === 'address' ? (
                      <>
                        <Input
                          value={output.address || ''}
                          onChange={(e) =>
                            handleOutputChange(index, 'address', e.target.value)
                          }
                          placeholder="Address (e.g., WafpWYepbV13FVM9Qp9brmBTXgjrn3dnfx)"
                          className="bg-gray-900/50 border-gray-700 text-sm"
                        />
                        <Input
                          value={output.value || ''}
                          onChange={(e) =>
                            handleOutputChange(index, 'value', e.target.value)
                          }
                          placeholder="Value (e.g., 10)"
                          className="bg-gray-900/50 border-gray-700 text-sm"
                        />
                        <Input
                          value={output.token || ''}
                          onChange={(e) =>
                            handleOutputChange(index, 'token', e.target.value)
                          }
                          placeholder="Token (optional, e.g., 00 for HTR)"
                          className="bg-gray-900/50 border-gray-700 text-sm"
                        />
                      </>
                    ) : (
                      <>
                        <Input
                          value={output.dataType || ''}
                          onChange={(e) =>
                            handleOutputChange(index, 'dataType', e.target.value)
                          }
                          placeholder="Type (optional)"
                          className="bg-gray-900/50 border-gray-700 text-sm"
                        />
                        <Input
                          value={output.data || ''}
                          onChange={(e) =>
                            handleOutputChange(index, 'data', e.target.value)
                          }
                          placeholder="Data (e.g., abc d)"
                          className="bg-gray-900/50 border-gray-700 text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Inputs Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Inputs (optional)</Label>
                <Button
                  onClick={handleAddInput}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Input
                </Button>
              </div>
              {sendTxParams.inputs.length > 0 && (
                <div className="space-y-2">
                  {sendTxParams.inputs.map((input, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={input.txId}
                        onChange={(e) =>
                          handleInputChange(index, 'txId', e.target.value)
                        }
                        placeholder="Transaction ID"
                        className="bg-gray-900/50 border-gray-700 flex-1 text-sm"
                      />
                      <Input
                        value={input.index}
                        onChange={(e) =>
                          handleInputChange(index, 'index', e.target.value)
                        }
                        placeholder="Index"
                        className="bg-gray-900/50 border-gray-700 w-20 text-sm"
                      />
                      <Button
                        onClick={() => handleRemoveInput(index)}
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

            {/* Change Address Section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Change Address (optional)</Label>
              <Input
                value={sendTxParams.changeAddress}
                onChange={(e) => handleChangeAddressChange(e.target.value)}
                placeholder="Change address"
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
            </div>
          </div>
        </>
      )}
    </BaseSnapCard>
  );
};
