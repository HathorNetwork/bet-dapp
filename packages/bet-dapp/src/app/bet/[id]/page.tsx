'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useParams, useRouter } from 'next/navigation';
import { getNanoContractById } from '@/lib/api/getNanoContractById';
import { NanoContract } from '@/lib/dynamodb/nano-contract';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { useJsonRpc } from '@/contexts/JsonRpcContext';
import { createBet } from './createBet';
import { ResultError } from '@/components/result-error';
import { WaitInput } from '@/components/wait-input';
import { EVENT_TOKEN_SYMBOL } from '@/constants';
import { getFullnodeNanoContractById } from '@/lib/api/getFullnodeNanoContractById';
import { NanoContractStateAPIResponse } from '@hathor/wallet-lib/lib/nano_contracts/types';
import { get } from 'lodash';
import { getFullnodeNanoContractHistoryById } from '@/lib/api/getFullnodeNanoContractHistoryById';
import { extractDataFromHistory, waitForTransactionConfirmation } from '@/lib/utils';
import { SendTransaction, Transaction } from '@hathor/wallet-lib';

const formSchema = z.object({
  bet: z.string().min(5),
  amount: z.coerce.number(),
});

export default function BetPage() {
  const router = useRouter();
  const params = useParams();
  const [waitingApproval, setWaitingApproval] = useState<boolean>(false);
  const [waitingConfirmation, setWaitingConfirmation] = useState<boolean>(false);
  const [bet, setBet] = useState<null | { amount: number, bet: string }>(null);
  const [error, setError] = useState<boolean>(false);
  const [nanoContract, setNanoContract] = useState<NanoContract | null>(null);
  const [fullnodeNanoContract, setFullnodeNanoContract] = useState<NanoContractStateAPIResponse | null>(null);
  const [totalBets, setTotalBets] = useState<number>(0);
  const { session, connect, getFirstAddress } = useWalletConnectClient();

  const updateNcData = useCallback(async (ncId: string) => {
    const firstAddress = getFirstAddress();
    
    const nc = await getNanoContractById(ncId);
    console.log('nc: ', nc);
    setNanoContract(nc);

    // State on fullnode:
    const fullnodeNc: NanoContractStateAPIResponse = await getFullnodeNanoContractById(nc.id, firstAddress);
    setFullnodeNanoContract(fullnodeNc);

    // History on fullnode:
    const history = await getFullnodeNanoContractHistoryById(nc.id)
    const [_totalInBets] = await extractDataFromHistory(history);

    setTotalBets(_totalInBets);
  }, [getFirstAddress]);

  useEffect(() => {
    if (!params || !params.id) {
      console.log('no id');
      return;
    }

    const ncId = params.id as string;
    updateNcData(ncId);
  }, [params, updateNcData]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      bet: '',
    },
  });

  const { hathorRpc } = useJsonRpc();

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    await connect();
    if (!nanoContract) {
      return;
    }
    setWaitingApproval(true);

    try {
      const firstAddress = getFirstAddress();
      const tx = await createBet(
        hathorRpc,
        firstAddress,
        nanoContract.id,
        values.bet,
        values.amount
      );

      setWaitingApproval(false);
      setWaitingConfirmation(true);
      await waitForTransactionConfirmation((tx.response as unknown as Transaction).hash as string);

      setBet({
        amount: values.amount,
        bet: values.bet
      });
    } catch (e) {
      setError(true);
    } finally {
      setWaitingApproval(false);
      setWaitingConfirmation(false);
    }
  }, [getFirstAddress, hathorRpc, connect, nanoContract ]);

  const onConnect = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();

    connect();
  }, [connect]);

  const onTryAgain = useCallback(() => {
    const values = form.getValues();
    setError(false);
    onSubmit(values);
  }, [form, onSubmit]);

  const onCancel = useCallback(() => {
    setError(false);
  }, []);

  const onSetResult = useCallback(async () => {
    if (!params || !params.id) {
      return;
    }

    router.push(`/set_result/${params.id}`);
  }, [params, router]);

  const connected = !!session;

  if (!nanoContract) {
    return null;
  }

  const oracleAddress = nanoContract.oracle;
  const result = get(fullnodeNanoContract, 'fields.final_result.value', null);
  const lastBet: number = get(fullnodeNanoContract, 'fields.date_last_bet.value', 0);
  const address = getFirstAddress();

  const now = Math.ceil(new Date().getTime() / 1000);

  const canPlaceABet = () => {
    return session
      && !result
      && lastBet >= now;
  };

  const canSetResult = () => {
    return (session != null)
      && address === oracleAddress
      && !result;
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6 flex-col">
      { error && (
        <ResultError
          title='Error during confirmation'
          description='The bet was not approved on your phone. Please, try again.'
          tryAgainText='Try again'
          cancelText='Modify bet'
          onTryAgain={onTryAgain}
          onCancel={onCancel}
        />
      )}
      { waitingApproval && (
        <WaitInput title='Waiting Approval' description='Please, approve this transaction on your phone.' />
      )}

      { waitingConfirmation && (
        <WaitInput title='Waiting Network Confirmation' description='Waiting for a block to confirm this transaction.' />
      )}
      { (!error && !waitingApproval && !waitingConfirmation) && (
      <>
        <Header logo={false} title='Betting' subtitle={`${nanoContract.title} - ${nanoContract.description}`} />
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
                          <>
                            {!bet && (<Input placeholder='E.g. Brazil' className="w-full text-lg h-12 text-center" {...field} />)}
                            { bet && <p className='h-12 bg-[#21262D] flex items-center justify-center text-white w-full text-lg font-semibold'>{bet.bet}</p>}
                          </>
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
                          <>
                            {!bet && <Input type="number" placeholder='E.g. 1000 EVC' className="w-full text-lg h-12 text-center" {...field} /> }
                            { bet && <p className='h-12 bg-[#21262D] flex items-center justify-center text-white w-full text-lg font-semibold'>{bet.amount} {EVENT_TOKEN_SYMBOL}</p>}
                          </>
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
                        disabled={!form.formState.isValid || !!bet || !canPlaceABet()}
                      >
                        Place bet!
                      </Button>
                    ) : (
                      <Button className="bg-hathor-purple-500 w-full text-white text-md h-12" onClick={onConnect}>
                        Connect wallet to place bet
                      </Button>
                    )}
                  </div>
                </form>

                <div className="flex-grow border-t border-[#484F58] w-full max-w-md mt-12 mb-12"></div>

                <TotalBets hash={nanoContract.id} />

                <Button
                  onClick={onSetResult}
                  className="bg-hathor-purple-500 w-full text-white max-w-md mt-12 h-12 text-md"
                  disabled={!canSetResult()}
                >
                  Set result
                </Button>
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
