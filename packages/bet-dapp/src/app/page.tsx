import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BASE_PATH } from '@/constants';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 flex-col">

      <div className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-6xl w-full h-[800px] p-6 sm:p-12 lg:p-16 bg-hathor-introduction border border-gray-800">
        <div className="absolute inset-0 bg-black opacity-10 rounded-lg"></div>

        <div className="relative z-10 text-center lg:text-left max-w-xl text-white text-left">
          <div className="mb-8">
            <Image alt="Hathor" width={150} height={100} src={`${BASE_PATH}/logo.svg`} />
          </div>

          <h1 className="text-4xl font-semibold m-0 bg-gradient-to-r from-hathor-purple-500 from-10% to-hathor-green-400 to-90% text-transparent bg-clip-text mb-8">
            Welcome to <br /> Hathor Play DEMO!
          </h1>

          <p className="text-base leading-relaxed mb-6 text-left">
            Here you will easily create your own 1 to 1 <br />
            <b>Betting Nano Contract</b> in just a few minutes! <br /><br />
            See how easy, fast, and secure it is and then: <br />
            <span className="font-bold">play to win thousands of HTRs!</span>
          </p>

          <div className="text-left">
            <Button className="rounded-sm text-white px-6 py-3 h-12 text-lg mt-8">
              <Link href='/create'>
                Start now!
              </Link>
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
