import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ChevronDown, CheckCircle } from 'lucide-react';
import { getShortHash } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { get } from 'lodash';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { useToast } from '@/components/ui/use-toast';

/**
 * RPC WalletConnect component - Connection interface for RPC testing
 * Adapted from the main WalletConnect component without betting-specific elements
 */
export const RpcWalletConnect = () => {
  const {
    connect,
    disconnect,
    session
  } = useWalletConnectClient();
  const { toast } = useToast();
  const connected = !!session;

  const address = React.useMemo(() => {
    const [_, _network, addr] = get(session, 'namespaces.hathor.accounts[0]', '::').split(':');

    return addr as string;
  }, [session]);

  const onConnect = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    console.log('RpcWalletConnect: onConnect called, current session:', session);
    await connect();
    console.log('RpcWalletConnect: connect() completed');
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

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Card className='flex justify-between p-2 items-center max-h-14 sm:flex-row'>
          <CardContent className='flex space-x-2 p-1 items-center p-0'>
            <Button variant='ghost' className='m-0 pl-2 pr-2'>
              <CreditCard size={16} />
            </Button>
            { !connected && (
              <Button onClick={onConnect} className='bg-hathor-yellow-500 p-2 pl-4 pr-4 hover:bg-hathor-yellow-600 text-black rounded-full outline outline-1 outline-hathor-yellow-400 text-xs font-semibold'>
                Wallet not connected
              </Button>
            )}
            { connected && (
              <Button onClick={onCopy} className='bg-green-700/20 p-2 pl-4 pr-4 hover:bg-green-700/30 text-green-400 rounded-full outline outline-1 outline-green-500/50 text-xs font-semibold'>
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
        { connected && (
          <>
            <div className='p-3 text-sm border-b border-gray-700'>
              <p className='text-gray-400 text-xs mb-1'>Connected Address</p>
              <p className='font-mono text-xs break-all'>{address}</p>
            </div>
            <Button variant='ghost' className='w-full p-0 rounded-none' onClick={onDisconnect}>
              Disconnect wallet
            </Button>
          </>
        )}
        { !connected && (
          <div className='p-3 text-sm text-gray-400'>
            <p>No wallet connected</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
