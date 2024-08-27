import * as React from 'react';
import { Card, CardContent } from './ui/card';
import { Loader2 } from 'lucide-react';

export interface WaitInputProps {
  title: string;
  description?: string;
}

const WaitInput = ({ title, description }: WaitInputProps) => {
  return (
    <Card className="relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
      <CardContent className="w-full flex items-center justify-center flex-col">
        <p className='text-white text-4xl font-semibold'>{ title }</p>
        <Loader2 size={60} className='text-hathor-purple-500 animate-spin mt-8 mb-8' />
        <p className='text-gray-500 text-sm'>{ description }</p>
      </CardContent>
    </Card>
  )
}

export { WaitInput }
