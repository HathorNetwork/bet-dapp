'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addHours } from 'date-fns';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { createNc } from './createNc';
import { useJsonRpc } from '@/contexts/JsonRpcContext';
import { WaitInput } from '@/components/wait-input';
import Link from 'next/link';
import Image from 'next/image';
import { ResultError } from '@/components/result-error';
import { useRouter } from 'next/navigation';
import { waitForTransactionConfirmation } from '@/lib/utils';
import { EVENT_TOKEN } from '@/constants';

function formatLocalDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd\'T\'HH:mm');
}

const formSchema = z.object({
  name: z.string().min(5),
  description: z.string().optional(),
  oracleType: z.enum(['publicKey', 'random']), // Ensure oracleType is either 'publicKey' or 'random'
  oracle: z.string().optional(),
  lastBetAt: z.date(),
}).refine((data) => {
  // Enforce that 'oracle' is required when 'oracleType' is 'publicKey'
  if (data.oracleType === 'publicKey') {
    return !!data.oracle;
  }
  return true;
}, {
  path: ['oracle'], // Specify the path of the error
  message: 'Public Key is required when Oracle Type is Public Key',
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
      name: '',
      description: '',
      oracleType: 'random',
      lastBetAt: addHours(new Date(), 2),
    },
  });

  const { hathorRpc } = useJsonRpc();

  const { session, connect, getFirstAddress } = useWalletConnectClient();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setWaitingApproval(true);

    const firstAddress = getFirstAddress();
    try {
      console.log('Will create bet', {
        hathorRpc,
        name: values.name,
        description: values.description || '',
        oracleType: values.oracleType,
        firstAddress,
        lastBetAt: values.lastBetAt.getTime(),
        token: '00'
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const nc = await createNc(
        hathorRpc,
        values.name,
        values.description || '',
        values.oracleType,
        values.oracleType === 'random' ? firstAddress : values.oracle as string,
        Math.ceil(values.lastBetAt.getTime() / 1000),
        EVENT_TOKEN,
      );
      console.log('Got result: ', nc);

      setWaitingApproval(false);
      setWaitingConfirmation(true);
      await waitForTransactionConfirmation(nc.hash as string);
      router.push(`/create/success/${nc.hash}`);
    } catch (e) {
      console.log('erroed: ', e);
      setError(true);
    } finally {
      setWaitingApproval(false);
      setWaitingConfirmation(false);
    }
  };

  const handleNotConnected = async (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    await connect();
  };

  const onTryAgain = () => {
    const values = form.getValues();
    setError(false);
    onSubmit(values);
  };

  const onCancel = useCallback(() => {
    router.replace('/');
  }, [router]);

  const oracleTypeValue = form.watch('oracleType');

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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name of the Main Event</FormLabel>
                      <FormControl>
                        <Input
                          className="w-full h-12"
                          placeholder="E.g. Olympic Games"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          className="w-full h-24"
                          placeholder="E.g. Men's Football Final"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Oracle Type Field (Select) */}
                <FormField
                  control={form.control}
                  name="oracleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oracle Type</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue="Random"
                        >
                          <SelectTrigger className="w-full h-12">
                            <SelectValue placeholder="Select one" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="random">Random</SelectItem>
                            <SelectItem value="publicKey">Choose your oracle</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {oracleTypeValue === "publicKey" && (
                  <FormField
                    control={form.control}
                    name="oracle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oracle</FormLabel>
                        <FormControl>
                          <Input
                            className="w-full h-12"
                            placeholder="E.g. WejPRb...3y5Mq"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="lastBetAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Bet At</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ? formatLocalDateTime(field.value) : ""}
                          onChange={(e) => field.onChange(
                            new Date(e.target.value || new Date().getTime())
                          )}
                          className="w-full h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Token</FormLabel>
                  <FormControl>
                    <Input type="text" className="w-full h-12" value='EVC' disabled />
                  </FormControl>
                  <FormDescription>
                    Token for this experience cannot be changed.
                  </FormDescription>
                </FormItem>

                <div className='flex justify-center items-center pt-8'>
                  <Button
                    className="bg-hathor-purple-500 text-white w-40 disabled:bg-[#21262D] disabled:text-[#484F58]"
                    type="submit"
                    onClick={(e) => !session ? handleNotConnected(e) : null}
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
