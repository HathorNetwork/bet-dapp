import * as React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { CreditCard, ChevronDown } from 'lucide-react';

export interface WalletConnectProps {
}

const WalletConnect = () => {
  const connected = false;

  return (
    <Card>
      <CardContent className='flex justify-between p-2 items-center space-x-4'>
        <CreditCard size={16} />
        { !connected && (
          <Button className='bg-hathor-purple-700 hover:bg-hathor-purple-600 text-white rounded-full outline outline-1 outline-hathor-purple-600 text-xs'>
            Wallet not connected
          </Button>
        )}
        <ChevronDown size={16} />
      </CardContent>
    </Card>
  )
}

export { WalletConnect }
