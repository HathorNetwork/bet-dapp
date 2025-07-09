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
import { getOracleBuffer, waitForTransactionConfirmation } from '@/lib/utils';
import { NanoContractTransactionParser, Network, Transaction } from '@hathor/wallet-lib';
import { find } from 'lodash';
import { BASE_PATH } from '@/constants';
import { useToast } from '@/components/ui/use-toast';

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
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const createPromiseRef = useRef<{ reject: (reason?: any) => void } | null>(null);
  const { toast } = useToast();
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

      // Wrap setResult in a promise we can reject
      const tx = await new Promise<any>((resolve, reject) => {
        createPromiseRef.current = { reject };

        // Generate a random tx hash for tracking
        const txHash = Math.random().toString(36).substring(2);
        setPendingTx(txHash);

        setResult(
          hathorRpcRef.current,
          nanoContract.id,
          getOracleBuffer(firstAddress),
          result,
        ).then((result) => {
          // If we got here, the transaction was approved in the wallet
          // Show toast if we were cancelled in the dapp
          if (createPromiseRef.current === null) {
            const { dismiss } = toast({
              title: "Transaction accepted",
              description: "Your transaction was accepted in the wallet. Click here to see the status.",
              duration: 10000, // 10 seconds
              action: (
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    dismiss();
                    setWaitingConfirmation(true);
                    waitForTransactionConfirmation((result.response as unknown as Transaction).hash as string).then(() => {
                      setWaitingConfirmation(false);
                      router.replace(`/results/${nanoContract.id}`);
                    });
                  }}
                  variant="outline"
                >
                  View Status
                </Button>
              ),
            });
            return;
          }
          resolve(result);
        }).catch(reject);
      });

      setWaitingApproval(false);
      setWaitingConfirmation(true);
      await waitForTransactionConfirmation((tx.response as unknown as Transaction).hash as string);
      setWaitingConfirmation(false);
      router.replace(`/results/${nanoContract.id}`);
    } catch (e) {
      // Don't show error if it was cancelled
      if (e === 'cancelled') {
        // If we have a pending tx, it means the user accepted in wallet after cancelling in dapp
        if (pendingTx) {
          toast({
            title: "Transaction accepted",
            description: "Your transaction was accepted in the wallet. Click here to see the status.",
            action: (
              <Button
                onClick={() => {
                  setWaitingConfirmation(true);
                  waitForTransactionConfirmation(pendingTx).then(() => {
                    router.replace(`/results/${nanoContract.id}`);
                  });
                }}
                variant="outline"
              >
                View Status
              </Button>
            ),
          });
          return;
        }
        return;
      }
      console.log('error: ', e);
      setError(true);
    } finally {
      createPromiseRef.current = null;
      setWaitingApproval(false);
      if (!pendingTx) {
        setWaitingConfirmation(false);
      }
      // Only clear pendingTx if we're not showing the toast
      if (!error && !waitingConfirmation) {
        setPendingTx(null);
      }
    }
  }, [router, randomValue, nanoContract, toast]);

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
            item.nc_address as string,
            new Network('testnet'),
            item.nc_args as string
          );

          if (item.nc_method === 'initialize'
            || item.nc_method === 'set_result'
            || item.nc_method === 'withdraw') {
            continue;
          }

          await deserializer.parseArguments();
          const parsedArgs = deserializer.parsedArgs;

          const scoreArg = find(parsedArgs, {
            name: 'score'
          });
          console.log('Parsed args: ', parsedArgs);
          const bet = scoreArg ? scoreArg.value : null;

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
    if (createPromiseRef.current) {
      createPromiseRef.current.reject('cancelled');
    }
    setWaitingApproval(false);
    setWaitingConfirmation(false);
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
    <main className="flex min-h-screen items-center justify-center p-6 flex-col bg-cover bg-papyrus-background">
      {error && (
        <ResultError
          title='Error during confirmation'
          description='The connection was not approved on your phone. Please, try again.'
          tryAgainText='Try again'
          cancelText='Go to home'
          onTryAgain={onTryAgain}
          onCancel={onCancel}
        />
      )}
      {loading && (
        <WaitInput title='Loading' description='Loading bet history, please wait.' />
      )}
      {waitingConfirmation && (
        <WaitInput title='Waiting Network Confirmation' description='Waiting for a block to confirm this transaction.' onCancel={onCancel} />
      )}
      {waitingApproval && (
        <WaitInput title='Waiting Approval' description='Please, approve this transaction on your phone.' onCancel={onCancel} />
      )}
      {(!error && !waitingApproval && !waitingConfirmation && !loading) && (
        <>
          <Header logo={false} title='Betting' subtitle={`${nanoContract.title} - ${nanoContract.description}`} />
          <Card className="relative flex items-center bg-cover bg-center rounded-lg rounded-tl-none shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
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
                      className="bg-hathor-yellow-500 hover:bg-hathor-yellow-600 text-black w-full text-md h-12 disabled:bg-[#21262D] disabled:text-[#484F58]">
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
        <Image alt="Hathor" width={100} height={25} src={`${BASE_PATH}/logo.svg`} />
      </Link>
    </main>
  );
}
