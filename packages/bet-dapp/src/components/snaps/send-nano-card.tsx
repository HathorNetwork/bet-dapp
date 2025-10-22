import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Minus } from 'lucide-react';
import { SendNanoParams } from './snap-method-handlers';

export interface SendNanoCardProps {
  onExecute: (params: SendNanoParams) => Promise<any>;
  onError?: (error: any) => void;
  disabled?: boolean;
  sendNanoParams: SendNanoParams;
  setSendNanoParams: (params: SendNanoParams) => void;
}

export const SendNanoCard: React.FC<SendNanoCardProps> = ({
  onExecute,
  onError,
  disabled = false,
  sendNanoParams,
  setSendNanoParams,
}) => {
  const [loading, setLoading] = useState(false);

  // Handlers for simple fields
  const handleFieldChange = (field: keyof SendNanoParams, value: any) => {
    setSendNanoParams({ ...sendNanoParams, [field]: value });
  };

  // Actions handlers - each entry is a JSON string in the UI, parsed at execution
  const [actionsStrings, setActionsStrings] = useState<string[]>(
    Array.isArray(sendNanoParams.actions)
      ? (sendNanoParams.actions as any[]).map((a) => JSON.stringify(a))
      : []
  );

  const handleAddAction = () => setActionsStrings([...actionsStrings, '']);
  const handleRemoveAction = (index: number) => {
    setActionsStrings(actionsStrings.filter((_, i) => i !== index));
  };
  const handleActionChange = (index: number, value: string) => {
    const next = [...actionsStrings];
    next[index] = value;
    setActionsStrings(next);
  };

  // Args handlers - each entry is a JSON string in the UI, parsed at execution
  const [argsStrings, setArgsStrings] = useState<string[]>(
    Array.isArray(sendNanoParams.args)
      ? (sendNanoParams.args as any[]).map((a) =>
          typeof a === 'string' ? a : JSON.stringify(a)
        )
      : []
  );

  const handleAddArg = () => setArgsStrings([...argsStrings, '']);
  const handleRemoveArg = (index: number) => {
    setArgsStrings(argsStrings.filter((_, i) => i !== index));
  };
  const handleArgChange = (index: number, value: string) => {
    const next = [...argsStrings];
    next[index] = value;
    setArgsStrings(next);
  };

  // Build params on execute by parsing JSON where possible
  const buildParamsForExecute = (): SendNanoParams => {
    const parsedActions: unknown[] | undefined = actionsStrings.length
      ? actionsStrings
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
          .map((s) => {
            try {
              return JSON.parse(s);
            } catch {
              // Fallback to raw string if not valid JSON
              return s;
            }
          })
      : undefined;

    const parsedArgs: unknown[] = argsStrings
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => {
        try {
          return JSON.parse(s);
        } catch {
          return s;
        }
      });

    const built: SendNanoParams = {
      method: sendNanoParams.method,
      args: parsedArgs,
      push_tx: sendNanoParams.push_tx,
    };

    if (sendNanoParams.blueprint_id && sendNanoParams.blueprint_id.trim()) {
      built.blueprint_id = sendNanoParams.blueprint_id.trim();
    }
    if (sendNanoParams.nc_id && sendNanoParams.nc_id.trim()) {
      built.nc_id = sendNanoParams.nc_id.trim();
    }
    if (parsedActions && parsedActions.length > 0) {
      built.actions = parsedActions;
    }

    return built;
  };

  return (
    <BaseSnapCard
      title="Send Nano TX"
      description="Execute a nano contract transaction with custom parameters"
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
                value={sendNanoParams.method}
                onChange={(e) => handleFieldChange('method', e.target.value)}
                placeholder="Method name (e.g., bet, initialize)"
                className="bg-gray-900/50 border-gray-700 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Blueprint ID (optional)</Label>
                <Input
                  value={sendNanoParams.blueprint_id || ''}
                  onChange={(e) => handleFieldChange('blueprint_id', e.target.value)}
                  placeholder="Blueprint ID"
                  className="bg-gray-900/50 border-gray-700 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">NC ID (optional)</Label>
                <Input
                  value={sendNanoParams.nc_id || ''}
                  onChange={(e) => handleFieldChange('nc_id', e.target.value)}
                  placeholder="Nano Contract ID"
                  className="bg-gray-900/50 border-gray-700 text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Actions (optional)</Label>
                <Button onClick={handleAddAction} variant="outline" size="sm" className="h-7 px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add Action
                </Button>
              </div>
              {actionsStrings.length > 0 && (
                <div className="space-y-2">
                  {actionsStrings.map((act, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={act}
                        onChange={(e) => handleActionChange(idx, e.target.value)}
                        placeholder='JSON action, e.g., {"type":"deposit","token":"00","amount":"1"}'
                        className="bg-gray-900/50 border-gray-700 flex-1 text-sm"
                      />
                      <Button
                        onClick={() => handleRemoveAction(idx)}
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

            {/* Args */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Args</Label>
                <Button onClick={handleAddArg} variant="outline" size="sm" className="h-7 px-2">
                  <Plus className="h-3 w-3 mr-1" /> Add Arg
                </Button>
              </div>
              {argsStrings.length > 0 && (
                <div className="space-y-2">
                  {argsStrings.map((arg, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={arg}
                        onChange={(e) => handleArgChange(idx, e.target.value)}
                        placeholder='JSON value or string (e.g., "1x0")'
                        className="bg-gray-900/50 border-gray-700 flex-1 text-sm"
                      />
                      <Button
                        onClick={() => handleRemoveArg(idx)}
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

            {/* Push TX */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Options</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sendNanoParams.push_tx}
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
