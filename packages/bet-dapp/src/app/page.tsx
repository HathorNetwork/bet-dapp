import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 flex-col">

      <div className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-6xl w-full h-[800px] p-6 sm:p-12 lg:p-16 bg-[url('/introduction.png')] border border-gray-800">
        <div className="absolute inset-0 bg-black opacity-10 rounded-lg"></div>

        <div className="relative z-10 text-center lg:text-left max-w-xl text-white text-left">
          <div className="mb-6">
            <Image alt="Hathor" width={150} height={100} src="/logo-hathor.svg" />
          </div>

          <h1 className="text-4xl text-left font-semibold bg-gradient-to-r from-hathor-purple-700 via-hathor-purple-400 to-hathor-green-500 text-transparent bg-clip-text mb-4">
            Welcome to <br /> Hathor Play DEMO!
          </h1>

          <p className="text-base leading-relaxed mb-6 text-left">
            Here you will easily create your own 1 to 1 <br />
            <b>Betting Nano Contract</b> in just a few minutes! <br /><br />
            See how easy, fast, and secure it is and then: <br />
            <span className="font-bold">play to win thousands of HTRs!</span>
          </p>

          <div className="text-left">
            <Button className="rounded-sm bg-hathor-purple-500 text-white px-6 py-3">
              Start now!
            </Button>
          </div>
        </div>
      </div>

      <span className="mt-4 text-sm text-hathor-purple-500">
        v0.3.0
      </span>
    </main>
  );
}
