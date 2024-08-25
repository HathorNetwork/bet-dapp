import * as React from 'react';

export interface TotalBetsProps {}

const TotalBets = () => {
  return (
    <div className='flex justify-between w-full max-w-md'>
      <p className='text-md subpixel-antialiased'>Total Bet</p>
      <p className='text-md subpixel-antialiased'>200 EVC</p>
    </div>
  )
}

export { TotalBets }
