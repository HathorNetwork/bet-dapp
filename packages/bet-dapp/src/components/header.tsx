import * as React from 'react';
import Image from 'next/image';
import { WalletConnect } from './walletconnect';
import Link from 'next/link';
import { BASE_PATH } from '@/constants';

export interface HeaderProps {
  logo?: boolean;
  title?: string;
  subtitle?: string;
}

const Header = ({ logo, title, subtitle }: HeaderProps) => {
  return (
    <div className='container pl-0 pr-0 p-8 pb-12 justify-between flex flex-col sm:flex-row md:flex-row lg:flex-row max-w-4xl'>
      { logo && (
        <Link href="/" className='flex justify-center md:justify-between lg:justify-between xl:justify-between mb-8 sm:mb-0 md:mb-0 lg:mb-0'>
          <Image alt="Hathor" width={100} height={25} src={`${BASE_PATH}/logo.svg`}/>
        </Link>
      )}
      { title && (
      <div className='flex flex-col justify-center mb-2 md:m-0 lg:m-0'>
        <p className='text-sm text-gray-400 mb-2'>{ title }</p>
        <p className='text-2xl text-white subpixel-antialiased'>{ subtitle }</p>
      </div>
      )}
      <WalletConnect />
    </div>
  )
}

export { Header }
