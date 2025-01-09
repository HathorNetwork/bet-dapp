'use client';

import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { EVENT_TOKEN, EVENT_TOKEN_SYMBOL } from '@/constants';
import { BASE_PATH } from '@/constants';
import { Plus } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { DateTimePicker } from '@/components/ui/datetime-picker';

function formatLocalDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd\'T\'HH:mm');
}

const formSchema = z.object({
  title: z.string().min(2),
  description: z.string().min(2),
  timestamp: z.date(),
  answers: z.array(z.object({
    text: z.string().min(1)
  })).min(2),
  oracleType: z.string(),
  oracle: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.oracleType === 'manual') {
    return !!data.oracle;
  }
  return true;
}, {
  message: "Oracle address is required for manual oracle type",
  path: ["oracle"]
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
      description: '',
      timestamp: addHours(new Date(), 1),
      answers: [{ text: '' }, { text: '' }],
      oracleType: 'random',
      oracle: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "answers"
  });

  const { hathorRpc } = useJsonRpc();

  const { session, connect, getFirstAddress } = useWalletConnectClient();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setWaitingApproval(true);

    const firstAddress = getFirstAddress();
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const nc = await createNc(
        hathorRpc,
        values.title,
        values.description,
        values.oracleType,
        values.oracleType === 'random' ? firstAddress : values.oracle as string,
        Math.ceil(values.timestamp.getTime() / 1000),
        EVENT_TOKEN,
        firstAddress,
        values.answers.map(a => a.text),
      );

      setWaitingApproval(false);
      setWaitingConfirmation(true);
      await waitForTransactionConfirmation(nc.hash as string);
      router.push(`/create/success/${nc.hash}`);
    } catch (e) {
      console.log('Got error: ', e);
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

  return (
    <main className="flex min-h-screen items-center justify-center p-6 flex-col bg-cover bg-papyrus-background">
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
        <Card className="relative flex items-start bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
          <CardContent className="w-full">
            <div className="text-center mb-16">
              <h1 className='text-4xl subpixel-antialiased text-bold font-kuenstler text-white mb-2'>Create your Bet</h1>
              <p className='text-white'>Create your own betting contracts and claim your spot in the sands of Hathor!</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name of the Main Event</FormLabel>
                      <FormControl>
                        <Input placeholder="Olympic Games" {...field} />
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
                        <Input placeholder="Men's Football Final" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Label>Add Answers</Label>
                  {fields.map((field, index) => (
                    <FormField
                      key={field.id}
                      control={form.control}
                      name={`answers.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-8">
                            <FormLabel className="min-w-[80px] text-sm">Option {index + 1}</FormLabel>
                            <div className="flex-1">
                              <FormControl>
                                <Input placeholder={`E.g. ${index === 0 ? 'Yes' : 'No'}`} {...field} />
                              </FormControl>
                            </div>
                            {index >= 2 && (
                              <Button 
                                type="button"
                                variant="secondary"
                                onClick={() => remove(index)}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => append({ text: '' })}
                      variant="outline"
                      className="flex items-center gap-2 bg-[#21262D] border-0 text-white hover:text-white hover:bg-[#2c3238]"
                    >
                      <Plus size={16} /> Add another
                    </Button>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="oracleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oracle Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="bg-[#21262D] border-0 text-white h-12">
                          <SelectValue placeholder="Select oracle type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">Random</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('oracleType') === 'manual' && (
                  <FormField
                    control={form.control}
                    name="oracle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Oracle Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter oracle address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="timestamp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last time to place a bet</FormLabel>
                      <FormControl>
                        <DateTimePicker value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Token</FormLabel>
                  <FormControl>
                    <Input type="text" className="w-full h-12" value={EVENT_TOKEN_SYMBOL} disabled />
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
        <Image alt="Hathor" width={100} height={25} src={`${BASE_PATH}/logo.svg`}/>
      </Link>
    </main>
  );
}
