'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { NcHistoryItem, columns } from '@/components/nc-history/columns';
import { DataTable } from '@/components/nc-history/data-table';
import Link from 'next/link';
import Image from 'next/image';
import { getNanoContracts } from '@/lib/api/getNanoContracts';
import { orderBy } from 'lodash';

export default function AllBetsPage() {
  const [data, setData] = useState<NcHistoryItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const nanoContracts = await getNanoContracts();
        setData(orderBy(nanoContracts, 'timestamp', ['desc']));
      } catch (e) {
      }
    })();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center p-6 flex-col">
      <Header logo={true} />
      <Card className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
        <CardContent className="w-full flex items-center justify-center flex-col">
          <h1 className='text-4xl subpixel-antialiased text-bold'>See all bets</h1>
          <p className='pb-16'>Choose the existing bet you want to see details</p>

          <DataTable columns={columns} data={data} />
        </CardContent>
      </Card>
      <Link href="/" className='flex justify-between mt-24'>
        <Image alt="Hathor" width={100} height={25} src="/logo-hathor.svg" />
      </Link>
    </main>
  );
}
