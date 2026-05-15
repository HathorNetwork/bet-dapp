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
    <div className='container p-0 justify-between flex flex-col sm:flex-row md:flex-row lg:flex-row max-w-4xl mb-8 sm:mb-4'>
      { logo && (
        <Link href="/" className='flex justify-center sm:justify-between mb-4 sm:mb-0'>
          <Image alt="Hathor" width={100} height={25} src={`${BASE_PATH}/logo.svg`}/>
        </Link>
      )}
      { title && (
        <div className='flex flex-col flex-grow mr-0 sm:mr-4'>
          <h1 className="text-black text-[32px] font-medium text-left font-kuenstler break-words break-all">{title}</h1>
          <div className='relative sm:max-h-[140px]'>
            <div className='sm:overflow-y-auto h-full pt-0.5 pb-8 sm:[mask-image:linear-gradient(to_bottom,transparent_0%,black_0.5rem,black_calc(100%-3rem),transparent)]'>
              <h2 className="text-black text-[20px] font-normal text-left font-kuenstler line-clamp-2 sm:line-clamp-none break-words break-all">{subtitle}</h2>
            </div>
          </div>
        </div>
      )}
      <div className='flex items-center flex-shrink-0 mt-4 sm:mt-0'>
        <WalletConnect />
      </div>
    </div>
  )
}

export { Header }
