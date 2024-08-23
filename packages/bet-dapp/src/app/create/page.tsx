'use client';

import React, { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

function formatLocalDateTime(date: Date): string {
  return format(date, 'yyyy-MM-dd\'T\'HH:mm');
}

const formSchema = z.object({
  name: z.string(),
  description: z.string(),
  oracleType: z.string(),
  oracle: z.string().optional(),
  lastBetAt: z.date(),
});

export default function CreateNanoContractLayout() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      oracleType: '',
      lastBetAt: new Date(),
    },
  });

  const onSubmit = useCallback((values: z.infer<typeof formSchema>) => {
    console.log(values);
  }, []);

  const oracleTypeValue = form.watch('oracleType');

  return (
    <main className='flex min-h-screen items-center justify-center p-6 flex-col'>
      <Header />
      <Card className='relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-6xl w-full h-[800px] p-6 sm:p-12 lg:p-16 border border-gray-800'>
        <CardContent className='items-center justify-center mx-auto'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8 max-w-md w-full flex flex-col gap-4'>
              {/* Name Field */}
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name of the Main Event</FormLabel>
                    <FormControl>
                      <Input className='w-full' placeholder='E.g. Olympic Games' {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="E.g. Men's Football Final" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Oracle Type Field (Select) */}
              <FormField
                control={form.control}
                name='oracleType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oracle Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue='Random'
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Select one' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='random'>Random</SelectItem>
                          <SelectItem value='walletAddress'>Wallet Address</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              { oracleTypeValue === 'walletAddress' && (
                <FormField
                  control={form.control}
                  name='oracle'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Oracle (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='E.g. WejPRb...3y5Mq' {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name='lastBetAt'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Bet At</FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
                        value={field.value ? formatLocalDateTime(field.value) : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button className='bg-hathor-purple-500 text-white' type='submit'>
                Create a bet
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
