import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';

export default function CreateNanoContractLayout() {
  return (
    <main className='flex min-h-screen items-center justify-center p-6 flex-col'>
      <Header />
      <Card className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-6xl w-full h-[800px] p-6 sm:p-12 lg:p-16 border border-gray-800">
        <CardContent>
        </CardContent>
      </Card>
    </main>
  );
}
