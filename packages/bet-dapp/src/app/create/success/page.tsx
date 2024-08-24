'use client';

import { HathorGradient } from '@/components/hathor-gradient';
import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import React from 'react';

export default function CreateSuccess() {
  return (
    <>
      <main className="flex min-h-screen items-center p-6 flex-col">
        <Header />
        <Card className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
          <CardContent className="w-full flex items-center justify-center flex-col">
            <div className='flex flex-row items-center justify-center'>
              <HathorGradient text={(<h1 className='text-4xl font-semibold p-4'>Congratulations!</h1>)} />
              <span className='text-4xl ml-4'>🎉</span>
            </div>

            <p className="leading-relaxed mb-6 text-left text-xl mt-8 text-bold text-center">
              Nano Contract created in just a few minutes! <br/>
              Scroll down to see all the hassle, time and money that you saved!
            </p>

            <div className='bg-black '>
            </div>

          </CardContent>
        </Card>
      </main>
    </>
  );
}
