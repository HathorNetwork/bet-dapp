import * as React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { CreditCard, ChevronDown, CheckCircle } from 'lucide-react';
import { getShortHash } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { get } from 'lodash';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { useToast } from './ui/use-toast';
import { useRouter } from 'next/navigation';

export interface WalletConnectProps {
}

const WalletConnect = () => {
  const {
    connect,
    disconnect,
    session
  } = useWalletConnectClient();
  const { toast } = useToast();
  const router = useRouter();
  const connected = !!session;

  const address = React.useMemo(() => {
    const [_, _network, addr] = get(session, 'namespaces.hathor.accounts[0]', '::').split(':');

    return addr as string;
  }, [session]);

  const onConnect = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    await connect();
  };

  const onDisconnect = () => {
    disconnect();
  };

  const onCopy = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    navigator.clipboard.writeText(address);
    toast({
      className: 'bg-[#193D11] h-8 w-72 justify-between',
      description: (
        <div className='flex flex-row items-center'>
          <CheckCircle size={12} className='mr-2 text-hathor-green-400'/>
          <p className='font-semibold font-white'>Address copied to clipboard!</p>
        </div>
      ),
    });
  }, [address, toast]);

  const onExit = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    router.replace('/thanks');
  }, [router]);

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
              <Button onClick={onCopy} className='bg-[#21262D] p-2 pl-4 pr-4 hover:bg-[#21262D] text-white rounded-full text-xs'>
                {getShortHash(address, 7)}
              </Button>
            )}
            <Button variant='ghost' className='m-0 pl-2 pr-2 mr-4'>
              <ChevronDown size={16} />
            </Button>
          </CardContent>
        </Card>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0">
        <Button variant='ghost' className='w-full p-0 rounded-none'>
          See all bets
        </Button>
        { connected && (
          <Button variant='ghost' className='w-full p-0 rounded-none' onClick={onDisconnect}>
            Disconnect wallet
          </Button>
        )}
        <Button variant='ghost' className='w-full p-0 rounded-none' onClick={onExit}>
          Exit bet
        </Button>
      </PopoverContent>
    </Popover>
  )
}

export { WalletConnect }
