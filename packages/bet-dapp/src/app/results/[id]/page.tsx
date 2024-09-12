'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { TotalBets } from '@/components/total-bets';
import { ArrowUpRight } from 'lucide-react';
import { DataTable } from '@/components/transaction-history/data-table';
import { columns } from '@/components/transaction-history/columns';
import { useParams, useRouter } from 'next/navigation';
import { NanoContractStateAPIResponse } from '@hathor/wallet-lib/lib/nano_contracts/types';
import { getFullnodeNanoContractHistoryById } from '@/lib/api/getFullnodeNanoContractHistoryById';
import { getFullnodeNanoContractById } from '@/lib/api/getFullnodeNanoContractById';
import { get } from 'lodash';
import { getNanoContractById } from '@/lib/api/getNanoContractById';
import { NanoContract } from '@/lib/dynamodb/nano-contract';
import { extractDataFromHistory, waitForTransactionConfirmation } from '@/lib/utils';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { EVENT_TOKEN, EVENT_TOKEN_SYMBOL, EXPLORER_URL } from '@/constants';
import { ResultError } from '@/components/result-error';
import { WaitInput } from '@/components/wait-input';
import { withdraw } from './withdraw';
import { useJsonRpc } from '@/contexts/JsonRpcContext';
import { prettyValue } from '@hathor/wallet-lib/lib/utils/numbers';
import { Transaction } from '@hathor/wallet-lib';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState([]);
  const [nanoContract, setNanoContract] = useState<NanoContract | null>(null);
  const [fullnodeNanoContract, setFullnodeNanoContract] = useState<NanoContractStateAPIResponse | null>(null);
  const [waitingApproval, setWaitingApproval] = useState<boolean>(false);
  const [waitingConfirmation, setWaitingConfirmation] = useState<boolean>(false);
  const [maxWithdrawal, setMaxWithdrawal] = useState<number>(0);
  const [error, setError] = useState<boolean>(false);
  const [totalInBets, setTotalInBets] = useState<number>(0);

  const { session, getFirstAddress, connect } = useWalletConnectClient();

  const {
    hathorRpc,
  } = useJsonRpc();

  useEffect(() => {
    const id = params?.id as string;

    if (!id) {
      return;
    }

    // fetch history
    (async () => {
      const nc = await getNanoContractById(id);
      setNanoContract(nc);

      const address = getFirstAddress();
      const fullnodeNc: NanoContractStateAPIResponse = await getFullnodeNanoContractById(id, address);
      setFullnodeNanoContract(fullnodeNc);

      const maxWithdrawalKey = Object.keys(fullnodeNc.calls)[0];
      if (maxWithdrawalKey) {
        // @ts-ignore
        const fullnodeMaxWithdrawal = fullnodeNc.calls[maxWithdrawalKey].value;
        setMaxWithdrawal(fullnodeMaxWithdrawal);
      }

      const history = await getFullnodeNanoContractHistoryById(id)
      const [_totalInBets, data] = await extractDataFromHistory(history);

      // @ts-ignore
      setData(data);
      setTotalInBets(_totalInBets);
    })();
  }, [params, getFirstAddress]);

  const result = get(fullnodeNanoContract, 'fields.final_result.value', null);

  const haveSomethingToWithdraw = () => {
    return true;
  };

  const canWithdraw = () => {
    return session
      && result
      && haveSomethingToWithdraw();
  };

  const onWithdraw = useCallback(async (amount: number) => {
    await connect();
    setWaitingApproval(true);

    if (!nanoContract) {
      return;
    }

    try {
      const firstAddress = getFirstAddress();
      const tx = await withdraw(hathorRpc, firstAddress, nanoContract.id, amount, EVENT_TOKEN);
      setWaitingApproval(false);
      setWaitingConfirmation(true);
      await waitForTransactionConfirmation((tx.response as unknown as Transaction).hash as string);

      router.replace(`/thanks`);
    } catch (e) {
      setError(true);
    } finally {
      setWaitingApproval(false);
      setWaitingConfirmation(false);
    }
  }, [hathorRpc, connect, getFirstAddress, nanoContract, router]);

  const onTryAgain = useCallback(() => {
    setError(false);
    onWithdraw(maxWithdrawal);
  }, [onWithdraw, maxWithdrawal]);

  const onCancel = useCallback(() => {
    setError(false);
  }, []);

  if (!nanoContract) {
    return null;
  }

  return (
    <main className="flex min-h-screen justify-center items-center p-6 flex-col">
      { waitingApproval && (
        <WaitInput title='Waiting Approval' description='Please, approve the withdraw transaction on your phone' />
      )}

      { waitingConfirmation && (
        <WaitInput title='Waiting Network Confirmation' description='Waiting for a block to confirm this transaction.' />
      )}
      { error && (
        <ResultError
          title='Error during confirmation'
          description='The connection was not approved on your phone. Please, try again.'
          tryAgainText='Try again'
          cancelText='Go back'
          onTryAgain={onTryAgain}
          onCancel={onCancel}
        />
      )}
      { (!error && !waitingApproval && !waitingConfirmation) && (
        <>
          <Header logo={false} title='Betting' subtitle={`${nanoContract.title} - ${nanoContract.description}`} />
          <div className='flex w-full justify-center items-center flex-col'>
            <Card className="flex justify-center items-center bg-cover bg-center rounded-lg max-w-4xl w-full p-8 sm:p-12 lg:p-16 border border-gray-800 min-h-[440px] min-w-sm">
              <CardContent className="w-full flex items-center justify-center flex-col max-w-md">
                { canWithdraw() && (
                  <>
                    <p className='text-white w-full mb-4 subpixel-antialiased text-2xl'>Winner 🥇</p>
                    <Button className='bg-hathor-green-500 hover:bg-hathor-green-500 text-white w-full h-12 text-lg'>{ result }</Button>

                    <p className='text-white w-full mb-4 subpixel-antialiased text-2xl mt-12'>Prize 💰</p>
                    <Button disabled className='bg-hathor-purple-500 w-full text-white disabled:bg-[#21262D] disabled:text-white disabled:opacity-1 text-md h-12'>{ prettyValue(maxWithdrawal) } { EVENT_TOKEN_SYMBOL }</Button>

                    { maxWithdrawal > 0 && (
                      <>
                        <p className='text-white w-full subpixel-antialiased text-2xl mt-12 text-center'>You won <span className='text-hathor-purple-500'>{ prettyValue(maxWithdrawal) } { EVENT_TOKEN_SYMBOL }</span>!</p>
                        <p className='text-white text-md mb-8'>Click below to withdraw your tokens to your wallet.</p>

                        <Button 
                          onClick={() => onWithdraw(maxWithdrawal)}
                          className='bg-hathor-purple-500 w-full text-white text-md h-12'
                        >
                          Collect your prize
                        </Button>
                      </>
                    )}
                  </>
                )}

                { !canWithdraw() && (
                  <>
                    <Button disabled className='bg-hathor-green-500 hover:bg-hathor-green-500 text-white w-full h-12 text-lg'>No result set yet.</Button>
                  </>
                )}

                <div className="flex-grow border-t border-[#484F58] w-full max-w-md mt-12 mb-12"></div>

                <TotalBets hash={nanoContract.id} />
              </CardContent>
            </Card>

            <Card className="flex bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full p-8 sm:p-12 lg:p-16 border border-gray-800 mt-8  min-h-[440px]">
              <CardContent className="w-full flex flex-col">
                <div className='w-full flex flex-row justify-between mb-8'>
                  <p className='text-white w-full mb-4 subpixel-antialiased text-2xl'>Transaction History</p>
                  <Link href={`${EXPLORER_URL}nano_contract/detail/${nanoContract.id}`}>
                    <Button variant="link" className='text-sm text-[#B7BFC7]'>
                      See full details in Explorer <ArrowUpRight />
                    </Button>
                  </Link>
                </div>

                <DataTable columns={columns} data={data} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Link href="/" className='flex justify-between mt-24'>
        <Image alt="Hathor" width={100} height={25} src="/logo-hathor.svg" />
      </Link>
    </main>
  );
}
