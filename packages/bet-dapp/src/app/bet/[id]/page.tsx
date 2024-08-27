'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { TotalBets } from '@/components/total-bets';
import { useParams } from 'next/navigation';
import { getNanoContractById } from '@/lib/api/getNanoContractById';
import { NanoContract } from '@/lib/dynamodb/nano-contract';

const formSchema = z.object({
  bet: z.string().min(5),
  amount: z.coerce.number(),
});

export default function BetPage() {
  const params = useParams();
  const [nanoContract, setNanoContract] = useState<NanoContract | null>(null);

  useEffect(() => {
    if (!params || !params.id) {
      return;
    }

    const ncId = params.id as string;
    (async () => {
      const nc = await getNanoContractById(ncId);
      setNanoContract(nc);
    })();
  }, [params]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      bet: '',
      amount: 0
    },
  });

  const onSubmit = useCallback((values: z.infer<typeof formSchema>) => {
    console.log(values);
  }, []);

  const connected = true;

  if (!nanoContract) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center p-6 flex-col">
      <Header logo={false} title='Betting' subtitle={nanoContract.title} />
      <Card className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
        <CardContent className="w-full flex items-center justify-center flex-col">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md w-full flex flex-col">
              <FormField
                control={form.control}
                name="bet"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white text-xl subpixel-antialiased'>Your bet</FormLabel>
                    <FormControl>
                      <Input placeholder='E.g. Brazil' className="w-full h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-white text-xl subpixel-antialiased'>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder='E.g. 1000 EVC' className="w-full h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-center items-center'>
                { connected ? (
                  <Button
                    className="bg-hathor-purple-500 w-full text-white disabled:bg-[#21262D] disabled:text-[#484F58] text-md h-12"
                    type="submit"
                    disabled={!form.formState.isValid}
                  >
                    Place bet!
                  </Button>
                ) : (
                  <Button className="bg-hathor-purple-500 w-full text-white text-md h-12">
                    Connect wallet to place bet
                  </Button>
                )}
              </div>
            </form>

            <div className="flex-grow border-t border-[#484F58] w-full max-w-md mt-12 mb-12"></div>

            <TotalBets />

            <Button className="bg-hathor-purple-500 w-full text-white max-w-md mt-12 h-12 text-md">
              Set result
            </Button>
          </Form>
        </CardContent>
      </Card>
      <Link href="/" className='flex justify-between mt-24'>
        <Image alt="Hathor" width={100} height={25} src="/logo-hathor.svg" />
      </Link>
    </main>
  );
}
