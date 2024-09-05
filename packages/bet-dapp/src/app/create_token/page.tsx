'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { useJsonRpc } from '@/contexts/JsonRpcContext';
import { WaitInput } from '@/components/wait-input';
import Link from 'next/link';
import Image from 'next/image';
import { ResultError } from '@/components/result-error';
import { useRouter } from 'next/navigation';
import { waitForTransactionConfirmation } from '@/lib/utils';
import { createToken } from './createToken';

const formSchema = z.object({
  title: z.string().min(2),
  symbol: z.string().max(5),
  amount: z.number(),
});

export default function CreateNanoContractPage() {
  const [waitingApproval, setWaitingApproval] = useState<boolean>(false);
  const [waitingConfirmation, setWaitingConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      symbol: '',
    },
  });

  const { hathorRpc } = useJsonRpc();

  const { connect } = useWalletConnectClient();

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    // connect is idempotent
    await connect();
    setWaitingApproval(true);

    try {
      console.log('Will create token', {
        hathorRpc,
        title: values.title,
        description: values.symbol,
        amount: values.amount,
      });
      const token = await createToken(
        hathorRpc,
        values.title,
        values.symbol,
        values.amount,
      );

      setWaitingApproval(false);
      setWaitingConfirmation(true);
      await waitForTransactionConfirmation(token.hash as string);
    } catch (e) {
      (true);
      setError(true);
    } finally {
      setWaitingApproval(false);
      setWaitingConfirmation(false);
    }
  }, [connect, hathorRpc]);

  const onTryAgain = useCallback(() => {
    const values = form.getValues();
    setError(false);
    onSubmit(values);
  }, [form, onSubmit]);

  const onCancel = useCallback(() => {
    router.replace('/');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6 flex-col">
      <Header logo={true} />
      { error && (
        <ResultError
          title='Error during confirmation'
          description='The connection was not approved on your phone. Please, try again.'
          tryAgainText='Try again'
          cancelText='Go to home'
          onTryAgain={onTryAgain}
          onCancel={onCancel}
        />
      )}
      { waitingConfirmation && (
        <WaitInput title='Waiting Network Confirmation' description='Waiting for a block to confirm this transaction.' />
      )}
      { waitingApproval && (
        <WaitInput title='Waiting Approval' description='Please, approve this transaction on your phone' />
      )}
      { (!error && !waitingApproval && !waitingConfirmation) && (
        <Card className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
          <CardContent className="w-full flex items-center justify-center flex-col">
            <h1 className='text-4xl subpixel-antialiased text-bold'>Create your Nano Contract</h1>
            <p className='pb-16'>for the Betting Event</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md w-full flex flex-col">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          className="w-full h-12"
                          placeholder="E.g. Yan Coin"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol</FormLabel>
                      <FormControl>
                        <Textarea
                          className="w-full h-24"
                          placeholder="E.g. YAN"
                          {...field}
                        />
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
                          <Input type="number" placeholder='E.g. 1000 EVC' className="w-full text-lg h-12 text-center" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-center items-center pt-8'>
                  <Button
                    className="bg-hathor-purple-500 text-white w-40 disabled:bg-[#21262D] disabled:text-[#484F58]"
                    type="submit"
                    disabled={!form.formState.isValid}
                  >
                    Create your bet
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
      <Link href="/" className='flex justify-between mt-24'>
        <Image alt="Hathor" width={100} height={25} src="/logo-hathor.svg" />
      </Link>
    </main>
  );
}
