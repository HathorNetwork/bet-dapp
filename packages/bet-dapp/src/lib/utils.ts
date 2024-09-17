import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Address, NanoContractTransactionParser, nanoUtils, Network } from '@hathor/wallet-lib';
import { EVENT_TOKEN_SYMBOL, NETWORK, WAIT_CONFIRMATION_MAX_RETRIES } from "@/constants";
import { IHistoryTx } from "@hathor/wallet-lib/lib/types";
import { find, get } from "lodash";
import { prettyValue } from "@hathor/wallet-lib/lib/utils/numbers";
import { getFullnodeTxById } from "./api/getFullnodeTxById";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getShortHash(hash: string, size = 6): string {
  return `${hash.substring(0, size)}...${hash.substring(hash.length - size, hash.length)}`;
}

export function formatDate(date: Date): string {
  const month = date.getMonth() + 1; // getMonth() is zero-based
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  const formattedMonth = month < 10 ? `0${month}` : month;
  const formattedDay = day < 10 ? `0${day}` : day;

  const formattedHours = hours < 10 ? `0${hours}` : hours;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${formattedMonth}/${formattedDay}, ${formattedHours}:${formattedMinutes}`;
}

export function getOracleBuffer(address: string) {
  return nanoUtils
    .getOracleBuffer(address, new Network(NETWORK))
    .toString('hex');
}

export function getAddressHex(address: string) {
  return (new Address(address)).decode().toString('hex');
}

export async function extractDataFromHistory(history: IHistoryTx[]): Promise<[number, {
  type: string,
  amount: string,
  bet: string,
  id: string,
  timestamp: Date,
}[]]> {
  const data = [];

  let totalInBets = 0;
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
        || item.nc_method === 'set_result') {
      continue;
    }

    await deserializer.parseArguments()

    const bet = get(find(deserializer.parsedArgs, { name: 'score' }), 'parsed', '-') as string;

    // @ts-ignore: nc_context is not yet in the lib
    const amount = item.nc_context.actions.reduce((acc, action) => {
      if (item.nc_method === 'bet' && action.type === 'deposit') {
        totalInBets += action.amount;
        return acc + action.amount;
      }

      if (item.nc_method === 'withdraw' && action.type === 'withdrawal') {
        return acc + action.amount;
      }

      return acc;
    }, 0);

    data.push({
      type: item.nc_method as string,
      amount: `${prettyValue(amount)} ${EVENT_TOKEN_SYMBOL}`,
      bet,
      id: item.tx_id as string,
      timestamp: new Date(item.timestamp * 1000),
    });
  }

  return [totalInBets, data];
}

export async function waitForTransactionConfirmation(hash: string, failures: number = 0) {
  if (failures > WAIT_CONFIRMATION_MAX_RETRIES) {
    throw new Error('Max retries reached.');
  }

  const { meta } = await getFullnodeTxById(hash);

  if (meta.voided_by.length > 0) {
    throw new Error('Transaction was voided.');
  }

  if (meta.first_block != null) {
    console.log('has first block!');
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return waitForTransactionConfirmation(hash, failures + 1);
}
