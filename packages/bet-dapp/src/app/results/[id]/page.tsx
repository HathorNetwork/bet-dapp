'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
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
import { NanoContractBlueprintInformationAPIResponse, NanoContractStateAPIResponse } from '@hathor/wallet-lib/lib/nano_contracts/types';
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
import { BASE_PATH } from '@/constants';
import { useToast } from '@/components/ui/use-toast';
import { getFullnodeTxById } from '@/lib/api/getFullnodeTxById';
import { getFullnodeBlueprintInfoById } from '@/lib/api/getFullnodeBlueprintInfoById';

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [data, setData] = useState([]);
  const [nanoContract, setNanoContract] = useState<NanoContract | null>(null);
  const [fullnodeNanoContract, setFullnodeNanoContract] = useState<NanoContractStateAPIResponse | null>(null);
  const [waitingApproval, setWaitingApproval] = useState<boolean>(false);
  const [waitingConfirmation, setWaitingConfirmation] = useState<boolean>(false);
  const [maxWithdrawal, setMaxWithdrawal] = useState<BigInt>(BigInt(0));
  const [error, setError] = useState<boolean>(false);
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const createPromiseRef = useRef<{ reject: (reason?: any) => void } | null>(null);
  const { toast } = useToast();
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
        console.log('fullnodeNc.calls', fullnodeNc.calls)
        setMaxWithdrawal(fullnodeMaxWithdrawal);
      }

      const fullnodeTx = await getFullnodeTxById(nc.id);
      const blueprintInfo: NanoContractBlueprintInformationAPIResponse = await getFullnodeBlueprintInfoById(fullnodeTx.tx.nc_blueprint_id);

      const history = await getFullnodeNanoContractHistoryById(id)
      const [_totalInBets, data] = await extractDataFromHistory(history, blueprintInfo);

      // @ts-ignore
      setData(data);
      setTotalInBets(_totalInBets);
    })();
  }, [params, getFirstAddress]);

  const result = get(fullnodeNanoContract, 'fields.final_result.value', null);

  const getUserBets = () => {
    if (!fullnodeNanoContract || !getFirstAddress()) return null;

    const address = getFirstAddress();
    const addressField = `address_details.a'${address}'`;
    const fields = fullnodeNanoContract.fields;
    const addressDetails = get(fields, addressField, null) as { value: Record<string, number> } | null;
    if (!addressDetails?.value) return null;

    return Object.entries(addressDetails.value).map(([bet, amount]) => ({
      bet,
      amount: amount
    }));
  };

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

      // Wrap withdraw in a promise we can reject
      const tx = await new Promise<any>((resolve, reject) => {
        createPromiseRef.current = { reject };

        // Generate a random tx hash for tracking
        const txHash = Math.random().toString(36).substring(2);
        setPendingTx(txHash);

        withdraw(
          hathorRpc,
          firstAddress,
          nanoContract.id,
          amount,
          EVENT_TOKEN
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
                      router.replace(`/thanks`);
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
      router.replace(`/thanks`);
    } catch (e) {
      // Don't show error if it was cancelled
      if (e === 'cancelled') {
        // If we have a pending tx, it means the user accepted in wallet after cancelling in dapp
        if (pendingTx) {
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
                  waitForTransactionConfirmation(pendingTx).then(() => {
                    setWaitingConfirmation(false);
                    router.replace(`/thanks`);
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
  }, [hathorRpc, connect, getFirstAddress, nanoContract, router, toast]);

  const onTryAgain = useCallback(() => {
    setError(false);
    onWithdraw(maxWithdrawal);
  }, [onWithdraw, maxWithdrawal]);

  const onCancel = useCallback(() => {
    if (createPromiseRef.current) {
      createPromiseRef.current.reject('cancelled');
    }
    setWaitingApproval(false);
    setWaitingConfirmation(false);
    setError(false);
  }, []);

  if (!nanoContract) {
    return null;
  }

  return (
    <main className="flex min-h-screen justify-center items-center p-6 flex-col bg-cover bg-papyrus-background">
      {waitingApproval && (
        <WaitInput title='Waiting Approval' description='Please, approve this transaction on your phone.' onCancel={onCancel} />
      )}

      {waitingConfirmation && (
        <WaitInput title='Waiting Network Confirmation' description='Waiting for a block to confirm this transaction.' onCancel={onCancel} />
      )}
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
      {(!error && !waitingApproval && !waitingConfirmation) && (
        <>
          <Header logo={false} title='Betting' subtitle={`${nanoContract.title} - ${nanoContract.description}`} />
          <div className='flex w-full justify-center items-center flex-col'>
            <Card className="flex justify-center items-center bg-cover bg-center rounded-lg max-w-4xl w-full p-8 sm:p-12 lg:p-16 border border-gray-800 min-h-[440px] min-w-sm">
              <CardContent className="w-full flex items-center justify-center flex-col max-w-md">
                {result && (
                  <>
                    <p className='text-white w-full mb-4 subpixel-antialiased text-2xl'>Winner 🥇</p>
                    <div className='bg-hathor-green-500 text-white w-full h-12 text-lg flex items-center justify-center rounded-md'>{result}</div>

                    <p className='text-white w-full mb-4 subpixel-antialiased text-2xl mt-12'>Prize 💰</p>
                    <Button disabled className='bg-hathor-purple-500 w-full text-white disabled:bg-[#21262D] disabled:text-white disabled:opacity-1 text-md h-12'>{prettyValue(maxWithdrawal)} {EVENT_TOKEN_SYMBOL}</Button>

                    {maxWithdrawal > 0n && (
                      <>
                        <p className='text-white w-full subpixel-antialiased text-2xl mt-12 text-center'>You won <span className='text-hathor-purple-500'>{prettyValue(maxWithdrawal)} {EVENT_TOKEN_SYMBOL}</span>!</p>
                        <p className='text-white text-md mb-8'>Click below to withdraw your tokens to your wallet.</p>

                        <Button
                          onClick={() => onWithdraw(maxWithdrawal)}
                          className='bg-hathor-yellow-500 hover:bg-hathor-yellow-600 w-full text-white text-md h-12'
                        >
                          Collect your prize
                        </Button>
                      </>
                    )}
                  </>
                )}

                {!result && (
                  <>
                    <Button disabled className='bg-hathor-green-500 hover:bg-hathor-green-500 text-white w-full h-12 text-lg'>
                      No result set yet.
                    </Button>
                  </>
                )}

                <div className="flex-grow border-t border-[#484F58] opacity-30 w-full max-w-md mt-12 mb-12"></div>
                <div className='w-full'>
                  <TotalBets hash={nanoContract.id} />
                </div>

                {getUserBets() && (
                  <>
                    <div className='w-full mt-12'>
                      <span className='text-white text-lg'>My bets:</span>
                      {getUserBets()?.map((bet, index) => (
                        <div key={index} className='flex justify-end items-center w-full mt-4'>
                          <div className='flex items-center gap-4'>
                            <div className='h-8 px-4 flex items-center rounded-full border border-[#2F3336] bg-transparent'>
                              <span className='text-white text-sm'>{prettyValue(bet.amount)} HTR</span>
                            </div>
                            <div className={`h-8 px-4 flex items-center rounded-full border ${bet.bet === result ? 'bg-[#1B4332] border-[#2E7D32]' : 'border-[#2F3336] bg-transparent'}`}>
                              <span className='text-white text-sm'>{bet.bet}</span>
                            </div>
                            <Link
                              href={`${EXPLORER_URL}transaction/${nanoContract.id}`}
                              target="_blank"
                              className='text-xs text-[#B7BFC7] h-8 px-4 rounded-full border border-[#2F3336] bg-transparent hover:bg-transparent hover:text-[#B7BFC7] hover:border-[#2F3336] flex items-center'
                            >
                              Details <ArrowUpRight className="h-3 w-3 ml-1" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
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
        <Image alt="Hathor" width={100} height={25} src={`${BASE_PATH}/logo.svg`} />
      </Link>
    </main>
  );
}
