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
import { Transaction } from '@hathor/wallet-lib';
import { IHistoryTx } from '@hathor/wallet-lib/lib/types';
import { BASE_PATH } from '@/constants';
import styled from 'styled-components';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const formSchema = z.object({
  bet: z.string().min(2),
  amount: z.coerce.number(),
});

const OptionsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  width: 100%;
`;

const BetOption = styled.button<{ selected?: boolean }>`
  padding: 1rem;
  background: ${props => props.selected ? '#FFC107' : '#21262D'};
  color: ${props => props.selected ? 'black' : 'white'};
  border: none;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.selected ? '#FFC107' : '#2c3238'};
  }

  span:first-child {
    font-size: 1.25rem;
    font-weight: 500;
  }

  span:last-child {
    font-size: 0.875rem;
    color: ${props => props.selected ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'};
  }
`;

const calculateBetPercentages = (fullnodeNc: NanoContractStateAPIResponse | null, options: string[]): Record<string, number> => {
  if (!fullnodeNc) return {};

  const total = get(fullnodeNc, 'fields.total.value', 0);
  if (total === 0) return Object.fromEntries(options.map(opt => [opt, 0]));

  return options.reduce((acc, option) => {
    const fields = get(fullnodeNc, 'fields', {});
    const betField = get(fields, `bets_total.${option}`, {});
    const betAmount = 'value' in betField && typeof betField.value === 'number' ? betField.value : 0;
    acc[option] = Math.round((betAmount / total) * 100);
    return acc;
  }, {} as Record<string, number>);
};

export default function BetPage() {
  const router = useRouter();
  const params = useParams();
  const [waitingApproval, setWaitingApproval] = useState<boolean>(false);
  const [waitingConfirmation, setWaitingConfirmation] = useState<boolean>(false);
  const [history, setHistory] = useState<{
    type: string,
    amount: string,
    bet: string,
    id: string,
    timestamp: Date,
  }[]>([]);
  const [bet, setBet] = useState<null | { amount: number, bet: string }>(null);
  const [error, setError] = useState<boolean>(false);
  const [nanoContract, setNanoContract] = useState<NanoContract | null>(null);
  const [fullnodeNanoContract, setFullnodeNanoContract] = useState<NanoContractStateAPIResponse | null>(null);
  const { session, connect, getFirstAddress } = useWalletConnectClient();

  const updateNcData = useCallback(async (ncId: string) => {
    const firstAddress = getFirstAddress();
    
    const nc = await getNanoContractById(ncId);
    setNanoContract(nc);

    // State on fullnode:
    const fullnodeNc: NanoContractStateAPIResponse = await getFullnodeNanoContractById(nc.id, firstAddress);
    setFullnodeNanoContract(fullnodeNc);

    // History on fullnode:
    const history = await getFullnodeNanoContractHistoryById(nc.id)
    const [_totalInBets, data] = await extractDataFromHistory(history);
    setHistory(data);
  }, [getFirstAddress]);

  useEffect(() => {
    if (!params || !params.id) {
      return;
    }

    const ncId = params.id as string;
    updateNcData(ncId);
  }, [params, updateNcData]);

  // Poll for result to check if it was already set.
  useEffect(() => {
    if (!nanoContract) { 
      return;
    }

    let interval: ReturnType<typeof setInterval>;
    const fetchValue = async () => {
      const firstAddress = getFirstAddress();
      const fullnodeNc: NanoContractStateAPIResponse = await getFullnodeNanoContractById(nanoContract.id, firstAddress, nanoContract.options);
      const fullnodeHistory: IHistoryTx[] = await getFullnodeNanoContractHistoryById(nanoContract.id);
      const [_, data] = await extractDataFromHistory(fullnodeHistory);

      if (fullnodeNc) {
        setFullnodeNanoContract(fullnodeNc);
      }
      setHistory(data);

      const result = get(fullnodeNc, 'fields.final_result.value', null);
      if (result) {
        // @ts-ignore
        clearInterval(interval);

        // Navigate to result
        router.replace(`/results/${nanoContract.id}`);
      }
    };

    fetchValue();
    interval = setInterval(fetchValue, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [nanoContract, getFirstAddress, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      bet: '',
      amount: 0
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
    setWaitingApproval(false);
    setWaitingConfirmation(false);
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
      && history.length > 0
      && address === oracleAddress
      && !result;
  };

  const betPercentages = calculateBetPercentages(fullnodeNanoContract, nanoContract?.options || []);
  return (
    <main className="flex min-h-screen items-center justify-center p-6 flex-col bg-cover bg-papyrus-background">
      <>
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

        { waitingApproval && (
          <WaitInput title='Waiting Approval' description='Please, approve this transaction on your phone.' onCancel={onCancel} />
        )}

        { waitingConfirmation && (
          <WaitInput title='Waiting Network Confirmation' description='Waiting for a block to confirm this transaction.' onCancel={onCancel} />
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
                            {nanoContract.options.length === 2 ? (
                              // Show side-by-side buttons for 2 options
                              <OptionsContainer>
                                {nanoContract.options.map((option) => (
                                  <BetOption
                                    key={option}
                                    type="button"
                                    selected={field.value === option}
                                    onClick={() => field.onChange(option)}
                                  >
                                    <span>{option}</span>
                                    <span>Total bet: {betPercentages[option] || 0}%</span>
                                  </BetOption>
                                ))}
                              </OptionsContainer>
                            ) : (
                              // Show dropdown for more than 2 options
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger className="bg-[#21262D] border-0 text-white h-12 text-lg pl-6 [&>svg]:text-white">
                                  <SelectValue placeholder="Select answer" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#21262D] border-0">
                                  {nanoContract.options.map((option) => (
                                    <SelectItem 
                                      key={option} 
                                      value={option}
                                      className="flex justify-between items-center text-white hover:bg-[#FFC107] hover:text-black focus:bg-[#FFC107] focus:text-black cursor-pointer py-3 pl-6 group"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="text-lg font-medium">{option}</span>
                                        <span className="text-sm text-gray-300 group-hover:text-black/70">- Total bet: {betPercentages[option] || 0}%</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
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
                                {!bet && <Input type="number" placeholder={`E.g. 1000 ${EVENT_TOKEN_SYMBOL}`} className="w-full text-lg h-12 text-center" {...field} /> }
                                { bet && <p className='h-12 bg-[#21262D] flex items-center justify-center text-white w-full text-lg font-semibold'>{bet.amount} {EVENT_TOKEN_SYMBOL}</p>}
                              </>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='flex justify-center items-center'>
                        <Button 
                          type="submit"
                          disabled={!form.formState.isValid || !!bet || !canPlaceABet()}
                          className="bg-hathor-yellow-500 hover:bg-hathor-yellow-600 text-black disabled:bg-[#21262D] disabled:text-[#484F58] w-full text-md h-12"
                        >
                          {connected ? 'Place bet!' : 'Connect wallet to place bet'}
                        </Button>
                      </div>
                    </form>

                    <div className="flex-grow border-t border-[#484F58] w-full max-w-md mt-12 mb-12"></div>

                    <TotalBets hash={nanoContract.id} />

                    <Button
                      onClick={onSetResult}
                      className="bg-hathor-yellow-500 hover:bg-hathor-yellow-600 text-black w-full max-w-md mt-12 h-12 text-md disabled:bg-[#21262D] disabled:text-[#484F58]"
                      disabled={!canSetResult()}
                    >
                      Set result
                    </Button>
                  </Form>
              </CardContent>
            </Card>
          </>
        )}
      </>
      <Link href="/" className='flex justify-between mt-24'>
        <Image alt="Hathor" width={100} height={25} src={`${BASE_PATH}/logo.svg`}/>
      </Link>
    </main>
  );
}
