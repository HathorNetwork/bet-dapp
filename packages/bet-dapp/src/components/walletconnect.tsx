import * as React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { CreditCard, ChevronDown } from 'lucide-react';
import { getShortHash } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export interface WalletConnectProps {
}

const WalletConnect = () => {
  const [connected, setConnected] = React.useState<boolean>(false);
  const onConnect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setConnected(!connected);
  };
  const onCopy = () => {};

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className='flex justify-between p-2 items-center max-h-14 sm:flex-row'>
          <CardContent className='flex space-x-2 p-1 items-center p-0'>
            <Button variant='ghost' className='m-0 pl-2 pr-2'>
              <CreditCard size={16} />
            </Button>
            { !connected && (
              <Button onClick={onConnect} className='bg-hathor-purple-700 p-2 pl-4 pr-4 hover:bg-hathor-purple-600 text-white rounded-full outline outline-1 outline-hathor-purple-600 text-xs'>
                Wallet not connected
              </Button>
            )}
            { connected && (
              <Button onClick={onConnect} className='bg-[#21262D] p-2 pl-4 pr-4 hover:bg-[#21262D] text-white rounded-full text-xs'>
                {getShortHash('Wd7v9y42bkW3qvG1Adg3hdgmiXe7mwUxsu', 7)}
              </Button>
            )}
            <Button variant='ghost' className='m-0 pl-2 pr-2 mr-4'>
              <ChevronDown size={16} />
            </Button>
          </CardContent>
        </Card>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <h1>ola mundo</h1>
      </PopoverContent>
    </Popover>
  )
}

export { WalletConnect }
