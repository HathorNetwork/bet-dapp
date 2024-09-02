import { EVENT_TOKEN_SYMBOL } from '@/constants';
import { prettyValue } from '@hathor/wallet-lib/lib/utils/numbers';
import * as React from 'react';

export interface TotalBetsProps {
  amount: number;
}

const TotalBets = ({ amount }: TotalBetsProps) => {
  return (
    <div className='flex justify-between w-full max-w-md'>
      <p className='text-md subpixel-antialiased'>Total Bet</p>
      <p className='text-md subpixel-antialiased'>{ prettyValue(amount) } {EVENT_TOKEN_SYMBOL}</p>
    </div>
  )
}

export { TotalBets }
