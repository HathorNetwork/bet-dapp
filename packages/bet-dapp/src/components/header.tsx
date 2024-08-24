import * as React from 'react';
import Image from 'next/image';
import { WalletConnect } from './walletconnect';
import Link from 'next/link';

export interface HeaderProps {
  logo?: boolean;
  title?: string;
  subtitle?: string;
}

const Header = ({ logo, title, subtitle }: HeaderProps) => {
  return (
    <div className='container pl-0 pr-0 p-8 pb-12 justify-between flex max-w-4xl'>
      { logo && (
        <Link href="/" className='flex justify-between'>
          <Image alt="Hathor" width={100} height={25} src="/logo-hathor.svg" />
        </Link>
      )}
      { title && (
      <div className='flex flex-col justify-center'>
        <p className='text-sm text-gray-400 mb-2'>{ title }</p>
        <p className='text-2xl text-white subpixel-antialiased'>{ subtitle }</p>
      </div>
      )}
      <WalletConnect />
    </div>
  )
}

export { Header }
