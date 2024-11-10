'use client';

import { HathorGradient } from '@/components/hathor-gradient';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import React from 'react';
import { BASE_PATH, EVENT_TOKEN_SYMBOL, URL } from '@/constants';

export default function ThanksPage() {
  return (
    <>
      <main className="flex min-h-screen items-center justify-center p-6 flex-col">
        <Card className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-6xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
          <CardContent className="w-full flex flex-col">
            <Image alt="Hathor" width={150} height={50} src={`${BASE_PATH}/logo_white.svg`}/>
            <div className='flex flex-col items-center justify-center sm:flex-col md:flex-col lg:flex-row xl:flex-row'>
              <div className='flex flex-col mt-12 pr-8'>
                <HathorGradient text={(
                  <h1 className='text-4xl font-semibold p-4 pb-0 pl-0'>
                    THANK YOU, HATHORIANS!
                  </h1>
                )} />
                <p className='text-[#FCB116] mt-8 font-semibold subpixel-antialiased'>Stay Connected</p>
                <p className='text-xl subpixel-antialiased'>Winners, send us your event {EVENT_TOKEN_SYMBOL}s <span className='bold'>to exchange for real HTRs!</span></p>
                <p className='text-[#FCB116] mt-8 subpixel-antialiased'>Embark on New Quests</p>
                <p className='text-md subpixel-antialiased'>Unearth weekly challenges by visiting our Quests link and discover what the ancients have in store.</p>
                <p className='text-md subpixel-antialiased mt-4'>Thank you for being part of the community, together, we are carving a new legacy in the sands of Hathor!</p>
              </div>
              <div className='h-full w-full flex p-4 flex flex-col justify-start items-center'>
                <div className='p-2 bg-white rounded-lg'>
                  <Image src={`${BASE_PATH}/qr_code.png`} alt={`${URL + BASE_PATH}`} width={200} height={200} className="w-[200px] h-[200px]"/>
                </div>
                <Button variant='link' className='text-sm text-[#B7BFC7] mt-4 text-md'>
                  <a href="https://hathor.network/">www.hathor.network</a>
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </main>
    </>
  );
}
