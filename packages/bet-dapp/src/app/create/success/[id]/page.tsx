'use client';

import { HathorGradient } from '@/components/hathor-gradient';
import { Card, CardContent } from '@/components/ui/card';
import React, { useCallback } from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import solarized from 'react-syntax-highlighter/dist/esm/styles/hljs/stackoverflow-dark';
import { ncCode } from './nano-contract.template';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useParams, useRouter } from 'next/navigation';

export default function CreateSuccess() {
  const params = useParams();
  const router = useRouter();

  const placeBet = useCallback(() => {
    if (!params || !params.id) {
      return;
    }

    router.push(`/bet/${params.id}`);
  }, [params, router]);

  return (
    <>
      <main className='flex min-h-screen items-center p-6 flex-col justify-center bg-cover bg-papyrus-background'> 
        <Card className='relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800'>
          <CardContent className='w-full flex items-center justify-center flex-col'>
            <HathorGradient text={(<h1 className='text-4xl p-4 font-kuenstler'>Nano Contract Created!</h1>)} />

            <p className='leading-relaxed mb-6 text-left text-md mt-8 text-bold text-center'>
              In the heart of the ancient crypto sands, your journey has begun!<br/>
              Below is the <span className='font-semibold text-[#FCB116]'>Nano Contract code</span> that will guide you on your path,<br/>
              saving you time and ensuring you have a safe journey.
            </p>

            <div className="w-full flex justify-center flex-col items-center mt-8">
              <div className='h-8 w-full rounded-tl-lg rounded-tr-lg bg-[#2F2F2F] max-w-[90%]'></div>
              <ScrollArea className="w-full max-w-[90%] h-[300px]" type='always'>
                <SyntaxHighlighter language="python" style={solarized} className='min-w-full' customStyle={{padding: 16, paddingTop: 0}}>
                  {ncCode}
                </SyntaxHighlighter>
                <ScrollBar orientation="horizontal" className="w-full" />
              </ScrollArea>
            </div>

            <p className='text-lg w-full text-center mt-12'>
              Now it&apos;s time: <span className='text-[#FCB116] subpixel-antialiased font-semibold'>place your bet and have fun.</span>
            </p>

            <Button onClick={placeBet} className='h-12 text-white mt-12 w-48 text-lg subpixel-antialiased font-semibold bg-hathor-yellow-500 hover:bg-hathor-yellow-600'>
              Place your bet!
            </Button>

          </CardContent>
        </Card>
      </main>
    </>
  );
}
