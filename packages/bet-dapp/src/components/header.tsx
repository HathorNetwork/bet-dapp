import * as React from 'react';
import Image from 'next/image';
import { WalletConnect } from './walletconnect';

export interface HeaderProps {
}

const Header = () => {
  return (
    <div className='container pl-0 pr-0 p-8 justify-between flex max-w-6xl'>
      <Image alt="Hathor" width={100} height={25} src="/logo-hathor.svg" />
      <WalletConnect />
    </div>
  )
}

export { Header }
