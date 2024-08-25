'use client';

import { HathorGradient } from '@/components/hathor-gradient';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import React from 'react';

export default function ThanksPage() {
  return (
    <>
      <main className="flex min-h-screen items-center justify-center p-6 flex-col">
        <Card className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-6xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
          <CardContent className="w-full flex flex-col">
            <Image alt="Hathor" width={150} height={50} src="/logo-hathor.svg" />
            <div className='flex flex-col items-center justify-center sm:flex-col md:flex-col lg:flex-row xl:flex-row'>
              <div className='flex flex-col mt-12 pr-8'>
                <HathorGradient text={(
                  <h1 className='text-4xl font-semibold p-4 pb-0 pl-0'>
                    Thanks for joining the
                  </h1>
                )} />
                <HathorGradient text={(
                  <h1 className='text-4xl font-semibold p-4 pt-0 pl-0'>
                    Nano Contracts DEMO!
                  </h1>
                )} />
                <p className='text-xl mt-8 subpixel-antialiased'>Winners, send us your EVCs <span className='bold'>to exchange for real HTRs!</span></p>
                <p className='text-lg mt-8'>You&apos;ve seen how easy it is to deploy smart contracts on Hathor Network — no specialized developers, no audits, no delays. Just focus on building your business with high scalability and fee-less transactions.</p>
                <p className='text-lg text-hathor-purple-500 subpixel-antialiased mt-8'>Trust only Hathor, and start developing your future dApps!</p>
              </div>
              <div className='h-full w-full flex p-4 flex flex-col justify-start items-center'>
                <Image src="/qr_code.png" alt="https://hathor.network/singapore" width={200} height={200} />
                <Button variant='link' className='text-sm text-[#B7BFC7] mt-4 text-md'>
                  https://hathor.network/singapore
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>
      </main>
    </>
  );
}
