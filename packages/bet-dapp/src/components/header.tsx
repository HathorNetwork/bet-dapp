import React, { useState } from 'react';
import Image from 'next/image';
import { WalletConnect } from './walletconnect';
import Link from 'next/link';
import { BASE_PATH } from '@/constants';
import { Button } from './ui/button';
import { useRequestSnap, useInvokeSnap } from 'snap-utils';
import { Loader2 } from 'lucide-react';

export interface HeaderProps {
  logo?: boolean;
  title?: string;
  subtitle?: string;
}

const Header = ({ logo, title, subtitle }: HeaderProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const requestSnap = useRequestSnap();
  const invokeSnap = useInvokeSnap();
  const getSnapBalance = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    const data = await invokeSnap({ method: 'htr_getBalance', params: { tokens: ['00', '00000337f9db18c355a376697f64fd6e36945fc984d6569b4b0d86e2af185945'] } });
    console.log('Balance', data);
    setLoading(false);
  }

  const getSnapAddress = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    const data = await invokeSnap({ method: 'htr_getAddress', params: { type: 'index', index: 0 } });
    console.log('Address', data);
    setLoading(false);
  }

  const getSnapNetwork = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    const data = await invokeSnap({ method: 'htr_getConnectedNetwork' });
    console.log('Network', data);
    setLoading(false);
  }

  const getSnapUtxos = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    // WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK
    const data = await invokeSnap({ method: 'htr_getUtxos', params: {} });
    console.log('Get utxos', data);
    setLoading(false);
  }

  const getSnapSendTx = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    const data = await invokeSnap({ method: 'htr_sendTransaction', params: { outputs: [{ address: 'WafpWYepbV13FVM9Qp9brmBTXgjrn3dnfx', value: '10' }, { data: 'abc d' }]} });
    console.log('Send tx', data);
    setLoading(false);
  }

  const getSnapCreateToken = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    const data = await invokeSnap({ method: 'htr_createToken', params: { name: 'test token', symbol: 'TST', amount: '100', address: 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N', change_address: 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK', create_mint: true, mint_authority_address: 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N', allow_external_mint_authority_address: true, create_melt: false, data: ['ab', 'c'] }});
    console.log('Create token', data);
    setLoading(false);
  }

  const getSnapSendNano = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    // initialize { 'blueprint_id': '000001291ad6218140ef41eef71f3c2fbeb000f6ddd592bc42c6cde9fa07a964', method: 'initialize', actions: [], args: ['76a914a3d942f602ea11b74c3b58d15531a35a80cab00388ac', '00', 1755997478]}
    // bet { 'nc_id': '00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490', method: 'bet', actions: [{ type: 'deposit', token: '00', amount: '1' }], args: ['WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N', '1x0']}
    const data = await invokeSnap({ method: 'htr_sendNanoContractTx', params: { 'nc_id': '00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490', method: 'bet', actions: [{ type: 'deposit', token: '00', amount: '1' }], args: ['WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N', '1x0']}});
    console.log('Send nano', data);
    setLoading(false);
  }

  const getSnapSendNanoCreateToken = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    const data = await invokeSnap({ method: 'htr_createNanoContractCreateTokenTx', params: {method: 'initialize', createTokenOptions: { contract_pays_token_deposit: false, name: 'test token', symbol: 'TST', amount: '100', address: 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N', change_address: 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK', create_mint: true, mint_authority_address: 'WR5kCGJFvqaonCCTZDPDVMpu8fRnFXN51N', allow_external_mint_authority_address: true, create_melt: true, data: ['ab', 'c'] }, data: {'blueprint_id': '000001291ad6218140ef41eef71f3c2fbeb000f6ddd592bc42c6cde9fa07a964', actions: [], args: ['76a914a3d942f602ea11b74c3b58d15531a35a80cab00388ac', '00', 1759997478]}}});
    console.log('Send nano and create token', data);
    setLoading(false);
  }

  const getSnapSignOracleData = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    const data = await invokeSnap({ method: 'htr_signOracleData', params: { nc_id: '00000d69f91f375fb76095010963579018b4a9c68549dc7466b09cf97305b490', data: '1x0', oracle: 'WdcPHo2NwjSkGtcVUDbrE1SQrUzGdPgLvK' }});
    console.log('Sign oracle data', data);
    setLoading(false);
  }

  const getSnapSignWithAddress = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    const data = await invokeSnap({ method: 'htr_signWithAddress', params: { message: 'test', addressIndex: 1 } });
    console.log('Sign with address', data);
    setLoading(false);
  }

  const getSnapChangeNetwork = async () => {
    setLoading(true);
    // Need to handle possible PromptRejectedError in case the user rejects the request
    const data = await invokeSnap({ method: 'htr_changeNetwork', params: { newNetwork: 'testnet' } });
    console.log('Change network', data);
    setLoading(false);
  }

  React.useEffect(() => {
    window.addEventListener("eip6963:announceProvider", (event) => {
      /* event.detail contains the discovered provider interface. */
      const providerDetail = event.detail

      // If it didn't get here, the user doesn't have MetaMask installed

      /* providerDetail.info.rdns is the best way to distinguish a wallet extension. */
      if (providerDetail.info.rdns === "io.metamask") {
        console.log("MetaMask successfully detected!")
        // Now you can use Snaps officially!
      } else if (providerDetail.info.rdns === "io.metamask.flask") {
        console.log("MetaMask Flask successfully detected!")
        // Now you can use Snaps!
      } else {
        console.error("Please install MetaMask Flask!")
      }
    });

    window.dispatchEvent(new Event("eip6963:requestProvider"));
  });

  return (
    <div className='container p-0 justify-between flex flex-col sm:flex-row md:flex-row lg:flex-row max-w-4xl mb-8 sm:mb-4'>
      { logo && (
        <Link href="/" className='flex justify-center sm:justify-between mb-4 sm:mb-0'>
          <Image alt="Hathor" width={100} height={25} src={`${BASE_PATH}/logo.svg`}/>
        </Link>
      )}
      { title && (
        <div className='flex flex-col flex-grow mr-0 sm:mr-4'>
          <h1 className="text-black text-[32px] font-medium text-left font-kuenstler break-words break-all">{title}</h1>
          <div className='relative sm:max-h-[140px]'>
            <div className='sm:overflow-y-auto h-full pt-0.5 pb-8 sm:[mask-image:linear-gradient(to_bottom,transparent_0%,black_0.5rem,black_calc(100%-3rem),transparent)]'>
              <h2 className="text-black text-[20px] font-normal text-left font-kuenstler line-clamp-2 sm:line-clamp-none break-words break-all">{subtitle}</h2>
            </div>
          </div>
        </div>
      )}
      <div className='flex items-center flex-shrink-0 mt-4 sm:mt-0'>
        <Button className="mr-2" onClick={getSnapAddress}>Get address</Button>
        <Button className="mr-2" onClick={getSnapBalance}>Get balance</Button>
        <Button className="mr-2" onClick={getSnapNetwork}>Get network</Button>
        <Button className="mr-2" onClick={getSnapUtxos}>Get utxos</Button>
        <Button className="mr-2" onClick={getSnapSendTx}>Send transaction</Button>
        <Button className="mr-2" onClick={getSnapSignWithAddress}>Sign with address</Button>
        <Button className="mr-2" onClick={getSnapCreateToken}>Create token</Button>
        <Button className="mr-2" onClick={getSnapSendNano}>Create Nano</Button>
        <Button className="mr-2" onClick={getSnapSignOracleData}>Oracle data</Button>
        <Button className="mr-2" onClick={getSnapSendNanoCreateToken}>Create Nano and token</Button>
        <Button className="mr-2" onClick={getSnapChangeNetwork}>Change network</Button>
        <Button onClick={requestSnap}>Snap</Button>
        {loading && <Loader2 size={60} className='text-hathor-yellow-500 animate-spin ml-2' />}
      </div>
    </div>
  )
}

export { Header }
