import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WalletState } from '@/contexts/WalletStateContext';

export interface AddressSelectorProps {
  walletState: WalletState;
  value: string;
  onChange: (address: string) => void;
  label?: string;
  placeholder?: string;
  description?: string;
  knownOnly?: boolean; // when true, force selection to known addresses only
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  walletState,
  value,
  onChange,
  label = 'Address',
  placeholder = 'Enter an address or select from known addresses',
  description,
  knownOnly = false,
}) => {
  // If knownOnly is requested we always keep the component in 'known' mode
  const [mode, setMode] = React.useState<'known' | 'custom'>('known');
  const [selectedIndex, setSelectedIndex] = React.useState<string>('0');

  const knownAddresses = Array.from(walletState.addresses.values()).sort((a, b) => a.index - b.index);
  const hasKnownAddresses = knownAddresses.length > 0;

  // Ensure selectedIndex is valid when known addresses change. If none set, pick first.
  React.useEffect(() => {
    if (hasKnownAddresses) {
      const exists = knownAddresses.find(a => a.index === parseInt(selectedIndex, 10));
      if (!exists) {
        setSelectedIndex(String(knownAddresses[0].index));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasKnownAddresses]);

  // If knownOnly prop is enabled, force mode to 'known' whenever it changes
  React.useEffect(() => {
    if (knownOnly) {
      setMode('known');
    }
  }, [knownOnly]);

  // Update the value when switching modes or selecting from known addresses
  React.useEffect(() => {
    if (mode === 'known' && hasKnownAddresses) {
      const addr = knownAddresses.find(a => a.index === parseInt(selectedIndex, 10));
      if (addr) {
        onChange(addr.address);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedIndex, hasKnownAddresses]);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>

      {/* Mode toggle is hidden when knownOnly is requested */}
      {!knownOnly && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === 'known' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('known')}
            disabled={!hasKnownAddresses}
            className="flex-1"
          >
            Known Addresses
          </Button>
          <Button
            type="button"
            variant={mode === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('custom')}
            className="flex-1"
          >
            Custom Address
          </Button>
        </div>
      )}

      {mode === 'known' ? (
        <div className="space-y-2">
          {hasKnownAddresses ? (
            <>
              <Select
                value={selectedIndex}
                onValueChange={setSelectedIndex}
              >
                <SelectTrigger className="bg-gray-900/50 border-gray-700">
                  <SelectValue placeholder="Select an address" />
                </SelectTrigger>
                <SelectContent>
                  {knownAddresses.map((addr) => (
                    <SelectItem key={addr.index} value={String(addr.index)}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Index {addr.index}</span>
                        <span className="text-xs text-gray-400 font-mono">
                          {`${addr.address.substring(0, 20)}...${addr.address.substring(addr.address.length - 8)}`}
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
              No known addresses. Please retrieve addresses first using &quot;Get Address&quot;.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Input
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
