'use client';

import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { WalletConnectClientContextProvider } from "@/contexts/WalletConnectClientContext";
import { Toaster } from "@/components/ui/toaster";
import { JsonRpcContextProvider } from "@/contexts/JsonRpcContext";
import { FULLNODE_URL, NETWORK } from '@/constants';
import { config } from '@hathor/wallet-lib';
import { initializeClient } from '@/contexts/WalletConnectClient';
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import StyledComponentsRegistry from '@/lib/registry';
import { MetaMaskProvider } from '@hathor/snap-utils';


config.setServerUrl(FULLNODE_URL);
config.setNetwork(NETWORK);

// Initialize the wallet-connect singleton

const inter = FontSans({
  subsets: ["latin"],
  variable: '--font-sans'
});

// 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [walletConnectConnected, setWalletConnectConnected] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      await initializeClient();
      setWalletConnectConnected(true);
    })();
  }, []);
  return (
    <html lang="pt-br" className="dark">
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased relative',
        'font-mona-sans',
        inter.variable
      )}>
        <div className="fixed inset-0 bg-black/15 pointer-events-none" />
        { !walletConnectConnected && (
          <main className="flex min-h-screen items-center justify-center p-6 flex-col">
            <Loader2 size={60} className='text-hathor-yellow-500 animate-spin mt-8 mb-8' />
          </main>
        )}
        { walletConnectConnected && (
          <WalletConnectClientContextProvider>
            <JsonRpcContextProvider>
              <MetaMaskProvider>
                <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
                <Toaster />
              </MetaMaskProvider>
            </JsonRpcContextProvider>
          </WalletConnectClientContextProvider>
        )}
      </body>
    </html>
  );
}
