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
  clearButton?: boolean; // when true, show a clear button to reset selection
}

export const AddressSelector: React.FC<AddressSelectorProps> = ({
  walletState,
  value,
  onChange,
  label = 'Address',
  placeholder = 'Enter an address or select from known addresses',
  description,
  knownOnly = false,
  clearButton = false,
}) => {
  // If knownOnly is requested we always keep the component in 'known' mode
  const [mode, setMode] = React.useState<'known' | 'custom'>('known');
  const [selectedIndex, setSelectedIndex] = React.useState<string>(clearButton ? 'none' : '0');

  const knownAddresses = Array.from(walletState.addresses.values()).sort((a, b) => a.index - b.index);
  const hasKnownAddresses = knownAddresses.length > 0;

  // If knownOnly prop is enabled, force mode to 'known' whenever it changes
  React.useEffect(() => {
    if (knownOnly) {
      setMode('known');
    }
  }, [knownOnly]);

  // Initialize with first known address if value is empty and we're not in clearButton mode
  React.useEffect(() => {
    if (hasKnownAddresses && !value && !clearButton && mode === 'known') {
      const firstAddress = knownAddresses[0];
      if (firstAddress) {
        console.log('[AddressSelector] Auto-initializing with first address:', firstAddress.address);
        setSelectedIndex(String(firstAddress.index));
        onChange(firstAddress.address);
      }
    }
  }, [hasKnownAddresses, value, clearButton, mode, onChange, knownAddresses]);

  // Sync selectedIndex with the incoming value prop when value changes externally
  React.useEffect(() => {
    if (value && hasKnownAddresses) {
      const matchingAddress = knownAddresses.find(a => a.address === value);
      if (matchingAddress) {
        if (selectedIndex !== String(matchingAddress.index)) {
          console.log('[AddressSelector] Syncing selectedIndex to match value:', matchingAddress.index);
          setSelectedIndex(String(matchingAddress.index));
        }
        if (mode !== 'known') {
          setMode('known');
        }
      } else if (value.trim() !== '') {
        // Value doesn't match any known address, must be custom
        if (mode !== 'custom') {
          setMode('custom');
        }
      }
    }
  }, [value, hasKnownAddresses, knownAddresses, selectedIndex, mode]);


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
              <div className="flex gap-2">
                <Select
                  value={selectedIndex}
                  onValueChange={(newIndex) => {
                    console.log('[AddressSelector] Select onValueChange:', newIndex);
                    setSelectedIndex(newIndex);

                    // Immediately update parent value
                    if (newIndex === 'none') {
                      onChange('');
                    } else {
                      const addr = knownAddresses.find(a => a.index === parseInt(newIndex, 10));
                      if (addr) {
                        console.log('[AddressSelector] Calling onChange with:', addr.address);
                        onChange(addr.address);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="bg-gray-900/50 border-gray-700 flex-1">
                    <SelectValue placeholder="Select an address" />
                  </SelectTrigger>
                  <SelectContent>
                    {clearButton && (
                      <SelectItem value="none">No filter (all addresses)</SelectItem>
                    )}
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
                {clearButton && selectedIndex !== 'none' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedIndex('none');
                    }}
                    className="flex-shrink-0"
                  >
                    Clear
                  </Button>
                )}
              </div>
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
