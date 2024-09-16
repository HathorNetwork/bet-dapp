'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { ResultError } from '@/components/result-error';
import { WaitInput } from '@/components/wait-input';
import { useJsonRpc } from '@/contexts/JsonRpcContext';
import { setResult } from './setResult';
import { getNanoContractById } from '@/lib/api/getNanoContractById';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { NanoContract } from '@/lib/dynamodb/nano-contract';
import { getFullnodeNanoContractHistoryById } from '@/lib/api/getFullnodeNanoContractHistoryById';
import { waitForTransactionConfirmation } from '@/lib/utils';
import { NanoContractTransactionParser, Network, Transaction } from '@hathor/wallet-lib';
import { find } from 'lodash';

const formSchema = z.object({
  result: z.string(),
});

function getRandomValue(array: string[]) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

export default function SetResultPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [waitingApproval, setWaitingApproval] = useState<boolean>(false);
  const [waitingConfirmation, setWaitingConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [nanoContract, setNanoContract] = useState<NanoContract | null>(null);
  const [randomValue, setRandomValue] = useState<string | null>(null);

  const { session, connect, getFirstAddress } = useWalletConnectClient();
  const { hathorRpc } = useJsonRpc();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      result: '',
    },
  });

  const getFirstAddressRef = useRef(getFirstAddress);
  const hathorRpcRef = useRef(hathorRpc);
  const connectRef = useRef(connect);

  useEffect(() => {
    getFirstAddressRef.current = getFirstAddress;
    hathorRpcRef.current = hathorRpc;
    connectRef.current = connect;
  }, [getFirstAddress, hathorRpc, connect]);

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    await connectRef.current();

    if (!nanoContract) {
      return;
    }

    setWaitingApproval(true);

    try {
      const firstAddress = getFirstAddressRef.current();

      let result = values.result;
      if (nanoContract.oracleType === 'random' && randomValue) {
        result = randomValue;
      }

      const tx = await setResult(
        hathorRpcRef.current,
        nanoContract.id,
        firstAddress,
        result,
      );

      setWaitingApproval(false);
      setWaitingConfirmation(true);
      await waitForTransactionConfirmation((tx.response as unknown as Transaction).hash as string);

      router.replace(`/results/${nanoContract.id}`);
    } catch (e) {
      console.log('error: ', e);
      setError(true);
    } finally {
      setWaitingApproval(false);
      setWaitingConfirmation(false);
    }
  }, [router, randomValue, nanoContract]);

  useEffect(() => {
    const ncId = params?.id as string;
    (async () => {
      const nc = await getNanoContractById(ncId);
      setNanoContract(nc);

      if (nc.oracleType === 'random') {
        const history = await getFullnodeNanoContractHistoryById(nc.id)

        const options: string[] = [];

        for (let i = 0; i < history.length; i++) {
          const item = history[i];
          const deserializer = new NanoContractTransactionParser(
            item.nc_blueprint_id as string,
            item.nc_method as string,
            item.nc_pubkey as string,
            new Network('testnet'),
            item.nc_args as string
          );

          if (item.nc_method === 'initialize'
              || item.nc_method === 'set_result'
              || item.nc_method === 'withdraw') {
            continue;
          }

          await deserializer.parseArguments()

          const scoreArg = find(deserializer.parsedArgs, {
            name: 'score'
          });
          const bet = scoreArg ? scoreArg.parsed : null;

          if (!bet) {
            continue;
          }

          const newOption: string = bet as string;

          if (options.indexOf(bet as string) < 0) {
            options.push(newOption);
          }
        }

        if (options.length > 0) {
          const value = getRandomValue(options);
          setRandomValue(value);
        }
      }

      setLoading(false);
    })();
  }, [params]);

  const onTryAgain = useCallback(() => {
    const values = form.getValues();
    setError(false);
    onSubmit(values);
  }, [form, onSubmit]);

  const onCancel = useCallback(() => {
    setError(false);
  }, []);

  const goBack = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    router.back();
  }, [router]);

  const connected = !!session;

  if (!nanoContract) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 flex-col">
      { error && (
        <ResultError
          title='Error during confirmation'
          description='The connection was not approved on your phone. Please, try again.'
          tryAgainText='Try again'
          cancelText='Modify Result'
          onTryAgain={onTryAgain}
          onCancel={onCancel}
        />
      )}
      { loading && (
        <WaitInput title='Loading' description='Loading bet history, please wait.' />
      )}
      { waitingConfirmation && (
        <WaitInput title='Waiting Network Confirmation' description='Waiting for a block to confirm this transaction.' />
      )}
      { waitingApproval && (
        <WaitInput title='Waiting Approval' description='Please, approve this transaction on your phone' />
      )}
      { (!error && !waitingApproval && !waitingConfirmation && !loading) && (
      <>
        <Header logo={false} title='Betting' subtitle={`${nanoContract.title} - ${nanoContract.description}`} />
        <Card className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
          <CardContent className="w-full flex items-center justify-center flex-col">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-md w-full flex flex-col">
                  {nanoContract.oracleType !== 'random' && (
                    <FormField
                      control={form.control}
                      name="result"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-white text-xl subpixel-antialiased'>
                            Result
                          </FormLabel>
                          <FormControl>
                            <Input placeholder='E.g. Brazil' className="w-full text-lg h-12 text-center" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {nanoContract.oracleType === 'random' && (
                    <FormItem>
                      <FormLabel className='text-white text-xl subpixel-antialiased'>
                        Result
                      </FormLabel>
                      <FormControl>
                        <p className='h-12 w-full text-lg text-white bg-[#21262D] justify-center items-center flex'>
                          Random
                        </p>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}

                  <div className='flex justify-center items-center'>
                    <Button
                      variant='link'
                      className="w-full text-white text-md h-12"
                      onClick={goBack}
                    >
                      Go back
                    </Button>
                    <Button
                      disabled={!connected}
                      type="submit"
                      className="bg-hathor-purple-500 w-full text-white text-md h-12">
                      Set Result
                    </Button>
                  </div>
                </form>
              </Form>
          </CardContent>
        </Card>
        </>
      )}
      <Link href="/" className='flex justify-between mt-24'>
        <Image alt="Hathor" width={100} height={25} src="/logo-hathor.svg" />
      </Link>
    </main>
  );
}
