'use client';

import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { WalletConnectClientContextProvider } from "@/contexts/WalletConnectClientContext";
import { Toaster } from "@/components/ui/toaster";

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
        'bg-hathor-pattern bg-cover bg-center',
        'font-mona-sans',
        inter.variable
      )}>
        <WalletConnectClientContextProvider>
          {children}
          <Toaster />
        </WalletConnectClientContextProvider>
      </body>
    </html>
  );
}
