'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TotalBets } from '@/components/total-bets';
import { ArrowUpRight } from 'lucide-react';
import { DataTable } from '@/components/transaction-history/data-table';
import { columns } from '@/components/transaction-history/columns';
import { addHours } from 'date-fns';

export default function ResultsPage() {
  const data = [{
    type: 'Bet',
    bet: 'Brazil',
    amount: 500,
    id: '0000002fba8eea57f12b7112f818d458975146daa16c3a4900e766dffe467c63',
    timestamp: new Date()
  }, {
    type: 'Bet',
    bet: 'Brazil',
    amount: 500,
    id: '000004fe95fed9c440954ebacb1088054b303c046a2aa97dbdb2f92cbfddc6ea',
    timestamp: addHours(new Date(), 5),
  }];

  return (
    <main className="flex min-h-screen items-center p-6 flex-col">
      <Header logo={false} title='Betting' subtitle="Olympic Games - Men's Football Finals" />
      <div className='flex w-full justify-center flex-col lg:flex-row md:flex-col sm:flex-col'>
        <Card className="flex justify-center items-center bg-cover bg-center rounded-lg max-w-4xl w-full p-8 sm:p-12 lg:p-16 border border-gray-800 min-h-[440px]">
          <CardContent className="w-full flex items-center justify-center flex-col max-w-md">
            <p className='text-white w-full mb-4 subpixel-antialiased text-2xl'>Winner 🥇</p>
            <Button className='bg-hathor-green-500 text-white w-full h-12 text-lg'>Brazil</Button>

            <p className='text-white w-full mb-4 subpixel-antialiased text-2xl mt-12'>Prize 💰</p>
            <Button disabled className='bg-hathor-purple-500 w-full text-white disabled:bg-[#21262D] disabled:text-[#484F58] text-md h-12'>200 EVC</Button>

            <p className='text-white w-full subpixel-antialiased text-2xl mt-12 text-center'>You won <span className='text-hathor-purple-500'>200 EVC</span>!</p>
            <p className='text-white text-md mb-8'>Click below to withdraw your tokens to your wallet.</p>
            <Button className='bg-hathor-purple-500 w-full text-white text-md h-12'>Collect your prize</Button>

            <div className="flex-grow border-t border-[#484F58] w-full max-w-md mt-12 mb-12"></div>

            <TotalBets />

          </CardContent>
        </Card>

        <Card className="flex bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full p-8 sm:p-12 lg:p-16 border border-gray-800 mt-4 md:mt-12 sm:mt-4 lg:mt-0 lg:ml-8 min-h-[440px]">
          <CardContent className="w-full flex flex-col">
            <div className='w-full flex flex-row justify-between mb-8'>
              <p className='text-white w-full mb-4 subpixel-antialiased text-2xl'>Transaction History</p>
              <Button variant="link" className='text-sm text-[#B7BFC7]'>
                See full details in Explorer <ArrowUpRight />
              </Button>
            </div>

            <DataTable columns={columns} data={data} />
          </CardContent>
        </Card>
      </div>

      <Link href="/" className='flex justify-between mt-24'>
        <Image alt="Hathor" width={100} height={25} src="/logo-hathor.svg" />
      </Link>
    </main>
  );
}
