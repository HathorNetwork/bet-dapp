import React, { useState } from 'react';
import { BaseSnapCard } from './base-snap-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export interface SnapMethodInput {
  name: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
}

export interface SnapActionButton {
  label: string;
  onExecute: () => Promise<any>;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
}

export interface SnapMethodCardProps {
  title: string;
  description: string;
  onExecute?: (inputValues?: Record<string, string>) => Promise<any>;
  buttonLabel?: string;
  onError?: (error: any) => void;
  inputs?: SnapMethodInput[];
  disabled?: boolean;
  actionButtons?: SnapActionButton[];
}

export const SnapMethodCard: React.FC<SnapMethodCardProps> = ({
  title,
  description,
  onExecute,
  buttonLabel = 'Execute',
  onError,
  inputs = [],
  disabled = false,
  actionButtons,
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingButtonIndex, setLoadingButtonIndex] = useState<number | null>(null);

  // Initialize input values with default values
  const [inputValues, setInputValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    inputs.forEach(input => {
      initial[input.name] = input.defaultValue;
    });
    return initial;
  });

  const handleInputChange = (name: string, value: string) => {
    setInputValues(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <BaseSnapCard
      title={title}
      description={description}
      onError={onError}
    >
      {(executeWrapper) => (
        <>
          {onExecute && !actionButtons && (
            <Button
              onClick={async () => {
                setLoading(true);
                try {
                  await executeWrapper(() => onExecute(inputValues));
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
                buttonLabel
              )}
            </Button>
          )}

          {inputs.length > 0 && (
            <div className="grid gap-3 pt-2">
              {inputs.map(input => (
                <div key={input.name} className="grid gap-2">
                  <Label htmlFor={input.name} className="text-sm font-medium">
                    {input.label}
                  </Label>
                  <Input
                    id={input.name}
                    value={inputValues[input.name] || ''}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    placeholder={input.placeholder}
                    className="bg-gray-900/50 border-gray-700"
                  />
                </div>
              ))}
            </div>
          )}

          {actionButtons && actionButtons.length > 0 && (
            <div className="flex gap-2 pt-2">
              {actionButtons.map((actionButton, index) => (
                <Button
                  key={index}
                  onClick={async () => {
                    setLoadingButtonIndex(index);
                    try {
                      await executeWrapper(
                        actionButton.onExecute,
                        { successMessage: `${actionButton.label} executed successfully` }
                      );
                    } finally {
                      setLoadingButtonIndex(null);
                    }
                  }}
                  disabled={actionButton.disabled || loadingButtonIndex !== null}
                  variant={actionButton.variant}
                  className={actionButton.className || "flex-1"}
                >
                  {loadingButtonIndex === index ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading
                    </>
                  ) : (
                    actionButton.label
                  )}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </BaseSnapCard>
  );
};
