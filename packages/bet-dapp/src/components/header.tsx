import * as React from 'react';
import Image from 'next/image';
import { WalletConnect } from './walletconnect';
import Link from 'next/link';
import { BASE_PATH } from '@/constants';
import { Card } from './ui/card';

export interface HeaderProps {
  logo?: boolean;
  title?: string;
  subtitle?: string;
}

const Header = ({ logo, title, subtitle }: HeaderProps) => {
  return (
    <div className='container p-0 justify-between flex flex-col sm:flex-row md:flex-row lg:flex-row max-w-4xl mb-16'>
      { logo && (
        <Link href="/" className='flex justify-center md:justify-between lg:justify-between xl:justify-between mb-8 sm:mb-0 md:mb-0 lg:mb-0'>
          <Image alt="Hathor" width={100} height={25} src={`${BASE_PATH}/logo.svg`}/>
        </Link>
      )}
      { title && (
        <div className='flex flex-col flex-grow mr-4'>
          <h1 className="text-black text-[32px] font-medium text-left font-kuenstler">{title}</h1>
          <div className='max-h-[140px] overflow-y-auto'>
            <h2 className="text-black text-[20px] font-normal text-left font-kuenstler">{subtitle}</h2>
          </div>
        </div>
      )}
      <div className='flex items-center flex-shrink-0'>
        <WalletConnect />
      </div>
    </div>
  )
}

export { Header }
