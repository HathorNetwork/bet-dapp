import { EVENT_TOKEN_SYMBOL } from '@/constants';
import { getFullnodeNanoContractById } from '@/lib/api/getFullnodeNanoContractById';
import { prettyValue } from '@hathor/wallet-lib/lib/utils/numbers';
import { get } from 'lodash';
import * as React from 'react';

export interface TotalBetsProps {
  hash: string;
}

const TotalBets = ({ hash }: TotalBetsProps) => {
  const [value, setValue] = React.useState<number>(0);

  const fetchValue = React.useCallback(async () => {
    try {
      const state = await getFullnodeNanoContractById(hash);
      const total = get(state, 'fields.total.value', 0);

      setValue(total);
    } catch (e) {
    }
  }, [hash]);

  React.useEffect(() => {
    if (!hash) { 
      return;
    }

    fetchValue();
    const interval = setInterval(fetchValue, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [hash, fetchValue]);

  return (
    <div className='flex justify-between items-center w-full max-w-md'>
      <span className='text-white text-lg'>Total bet</span>
      <div className='h-8 px-4 flex items-center rounded-full border border-[#2F3336] bg-transparent'>
        <span className='text-white text-sm'>{ prettyValue(value) } {EVENT_TOKEN_SYMBOL}</span>
      </div>
    </div>
  )
}

export { TotalBets }
