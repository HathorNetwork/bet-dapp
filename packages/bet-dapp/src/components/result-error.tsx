import * as React from 'react';
import { Card, CardContent, CardFooter } from './ui/card';
import { TriangleAlert } from 'lucide-react';
import { Button } from './ui/button';

export interface ResultErrorProps {
  title: string;
  description?: string;
  tryAgainText: string;
  cancelText: string;
  onCancel: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onTryAgain: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ResultError = ({
  title,
  description,
  tryAgainText,
  cancelText,
  onTryAgain,
  onCancel,
}: ResultErrorProps) => {
  return (
    <Card className="bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800">
      <CardContent className="w-full flex items-center justify-center flex-col">
        <p className='text-white text-4xl font-semibold'>{ title }</p>
        <div className='bg-[#590B00] text-white flex flex-row items-center mt-12 rounded-md px-4 py-2'>
          <TriangleAlert size={16} className='text-[#FF7966] mr-2' />
          { title }
        </div>
        <p className='text-gray-500 text-sm mt-12'>{ description }</p>
      </CardContent>
      <CardFooter className='flex items-center justify-between mt-8 pl-40 pr-40'>
        <Button onClick={onCancel} variant='ghost' className='text-hathor-yellow-500 hover:text-hathor-yellow-600 hover:bg-transparent'>
          { cancelText }
        </Button>
        <Button onClick={onTryAgain} variant='default' className='h-12 text-black w-48 bg-hathor-yellow-500 hover:bg-hathor-yellow-600'>
          { tryAgainText }
        </Button>
      </CardFooter>
    </Card>
  )
}

export { ResultError }
