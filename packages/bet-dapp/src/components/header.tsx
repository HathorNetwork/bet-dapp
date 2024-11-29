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
    <div className='container p-0 justify-between flex flex-col sm:flex-row md:flex-row lg:flex-row max-w-4xl'>
      { logo && (
        <Link href="/" className='flex justify-center md:justify-between lg:justify-between xl:justify-between mb-8 sm:mb-0 md:mb-0 lg:mb-0'>
          <Image alt="Hathor" width={100} height={25} src={`${BASE_PATH}/logo.svg`}/>
        </Link>
      )}
      { title && (
      <Card className='flex flex-col justify-center p-4 rounded-none rounded-tl-lg rounded-tr-lg bg-[#24292F]'>
        <p className='text-sm text-gray-200 mb-2'>{ title }</p>
        <p className='text-2xl subpixel-antialiased font-kuenstler text-[#FCB116]'>{ subtitle }</p>
      </Card>
      )}
      <div className='pt-5 mb-8'>
        <WalletConnect />
      </div>
    </div>
  )
}

export { Header }
