import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Minus, ArrowRightLeft, Copy, CheckCircle2, XCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WalletState } from '@/contexts/WalletStateContext';
import { useToast } from '@/components/ui/use-toast';

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

export interface RpcSendTxCardProps {
  onExecute: (params: SendTxParams) => Promise<any>;
  disabled?: boolean;
  sendTxParams: SendTxParams;
  setSendTxParams: (params: SendTxParams) => void;
  walletState: WalletState;
}

export const RpcSendTxCard: React.FC<RpcSendTxCardProps> = ({
  onExecute,
  disabled = false,
  sendTxParams,
  setSendTxParams,
  walletState,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<{ method: string; params: any } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [requestExpanded, setRequestExpanded] = useState(false);
  const { toast } = useToast();

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
      const errorMsg = 'No UTXOs available in wallet state';
      setError(errorMsg);
      toast({
        title: 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
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

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRequestInfo(null);

    try {
      const { request, response } = await onExecute(sendTxParams);

      // Store request and response separately
      setRequestInfo(request);
      setResult(response);
      setRequestExpanded(true);
      setExpanded(true);

      // Log to console
      console.log(`[RPC Request] Send Transaction`, request);
      console.log(`[RPC Success] Send Transaction`, response);

      toast({
        title: 'Success',
        description: 'Transaction sent successfully',
      });
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      setExpanded(true);

      // Log full error to console for debugging
      console.error(`[RPC Error] Send Transaction`, {
        message: errorMessage,
        error: err,
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

  const hasResult = result !== null || error !== null;

  // Render result (raw JSON)
  const renderResult = () => {
    if (!result) return null;

    try {
      const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

      const entries = Object.entries(parsedResult);
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
            <h3 className="text-lg font-semibold mb-1">Send Transaction</h3>
            <p className="text-sm text-gray-400">Send a transaction with custom outputs and inputs</p>
          </div>
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
            onClick={handleExecute}
            disabled={loading || disabled}
            className="flex-shrink-0"
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending
              </>
            ) : (
              'Send Transaction'
            )}
          </Button>
        </div>

        {/* Transaction Hash Display (if available) */}
        {result && result.hash && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-700/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-green-400 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              <span>Transaction Sent Successfully</span>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-400">Transaction Hash</Label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.hash);
                      toast({ title: 'Copied', description: 'Transaction hash copied to clipboard' });
                    }}
                    className="text-gray-500 hover:text-hathor-yellow-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
                <div className="mt-1 p-2 bg-gray-900/50 rounded border border-gray-700 font-mono text-xs text-gray-200 break-all">
                  {result.hash}
                </div>
              </div>
            </div>
          </div>
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

        {/* Raw Result Section - Yellow */}
        {hasResult && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm font-medium text-hathor-yellow-500 hover:text-hathor-yellow-400 flex items-center"
              >
                {expanded ? '▼' : '▶'} {error ? 'Error Details' : 'Raw Result'}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const textToCopy = result ? JSON.stringify(result, null, 2) : error || '';
                  navigator.clipboard.writeText(textToCopy);
                  toast({
                    title: 'Copied',
                    description: 'Result copied to clipboard',
                  });
                }}
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
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-200 mb-1">Error occurred</p>
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-hathor-yellow-900/20 border border-hathor-yellow-500/50 rounded">
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

