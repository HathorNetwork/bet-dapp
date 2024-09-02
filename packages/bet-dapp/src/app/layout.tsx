'use client';

import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { WalletConnectClientContextProvider } from "@/contexts/WalletConnectClientContext";
import { Toaster } from "@/components/ui/toaster";
import { JsonRpcContextProvider } from "@/contexts/JsonRpcContext";
import { FULLNODE_URL, NETWORK } from '@/constants';
import { config } from '@hathor/wallet-lib';

config.setServerUrl(FULLNODE_URL);
config.setNetwork(NETWORK);

const inter = FontSans({
  subsets: ["latin"],
  variable: '--font-sans'
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="dark">
      <body className={cn(
        'min-h-screen bg-background font-sans antialiased',
        'bg-gradient-to-b from-black via-[#1C0B33] via-85% to-[#180A2D]',
        'font-mona-sans',
        inter.variable
      )}>
        <WalletConnectClientContextProvider>
          <JsonRpcContextProvider>
            {children}
            <Toaster />
          </JsonRpcContextProvider>
        </WalletConnectClientContextProvider>
      </body>
    </html>
  );
}
