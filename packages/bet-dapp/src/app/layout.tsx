import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = FontSans({
  subsets: ["latin"],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: "Hathor Betting dApp",
  description: "Bet your way to the top",
};

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
        {children}
      </body>
    </html>
  );
}
