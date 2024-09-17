'use client'

import { Column, ColumnDef, HeaderContext } from '@tanstack/react-table'
import { formatDate, getShortHash } from '@/lib/utils';
import { Button } from '../ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { EXPLORER_URL } from '@/constants';

export type TransactionHistoryItem = {
  type: string
  bet: string
  amount: number
  id: string
  timestamp: Date
}

const TableHeader = (name: string) => (
  <p className='text-left text-lg subpixel-antialiased text-hathor-purple-500'>
    { name.toUpperCase() }
  </p>
);

const SortableTableHeader = (name: string, column: Column<TransactionHistoryItem, unknown>) => {
  const Arrow = (sorted: false | string) => {
    switch(sorted) {
      case 'asc':
        return <ArrowUp className="ml-2 h-4 w-4 text-hathor-purple-500" />
      case 'desc':
        return <ArrowDown className="ml-2 h-4 w-4 text-hathor-purple-500" />
      default:
        return <ArrowUpDown className="ml-2 h-4 w-4 text-hathor-purple-500" />
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      { TableHeader(name) }
      { Arrow(column.getIsSorted()) }
    </Button>
  );
}

const RowText = (text: string, bold: boolean = false) => {
  return (
    <div className='h-16 flex items-center'>
      <p className={`text-lg text-left text-[#B7BFC7] ${bold ? ' text-white' : ''}`}>
        { text }
      </p>
    </div>
  )
};

const RowLink = (href: string, text: string, bold: boolean = false) => {
  return (
    <div className='h-16 flex items-center'>
      <Link href={href}>
        <Button variant='link' className={`text-lg text-left text-[#B7BFC7] ${bold ? ' text-white' : ''}`}>
          { text }
        </Button>
      </Link>
    </div>
  )
};

const RowCapitalizeFirst = (text: string) => {
  return RowText(text.charAt(0).toUpperCase() + text.slice(1))
};

const RowTransactionId = (id: string) => {
  return RowLink(`${EXPLORER_URL}transaction/${id}`, getShortHash(id), true)
};

export const columns: ColumnDef<TransactionHistoryItem>[] = [{
  accessorKey: 'type',
  header: () => TableHeader('type'),
  cell: ({ row }) => RowCapitalizeFirst(row.getValue('type')),
}, {
  accessorKey: 'bet',
  header: () => TableHeader('bet'),
  cell: ({ row }) => RowCapitalizeFirst(row.getValue('bet')),
}, {
  accessorKey: 'amount',
  header: () => TableHeader('amount'),
  cell: ({ row }) => RowText(row.getValue('amount')),
}, {
  accessorKey: 'id',
  header: () => TableHeader('id'),
  cell: ({ row }) => RowTransactionId(row.getValue('id')),
}, {
  accessorKey: 'timestamp',
  header: (header: HeaderContext<TransactionHistoryItem, unknown>) => SortableTableHeader('timestamp', header.column),
  cell: ({ row }) => RowText(formatDate(row.getValue('timestamp'))),
}];
