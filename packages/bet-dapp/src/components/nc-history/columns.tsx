'use client'

import { Column, ColumnDef, HeaderContext } from '@tanstack/react-table'
import { formatDate, getShortHash } from '@/lib/utils';
import { Button } from '../ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { EXPLORER_URL } from '@/constants';

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type NcHistoryItem = {
  title: string
  id: string
  createdAt: Date,
}

const TableHeader = (name: string) => (
  <p className='text-left text-lg subpixel-antialiased text-hathor-purple-500'>
    { name.toUpperCase() }
  </p>
);

const SortableTableHeader = (name: string, column: Column<NcHistoryItem, unknown>) => {
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
      <p className={`text-lg text-right text-[#B7BFC7] ${bold ? ' text-white' : ''}`}>
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

const RowTransactionId = (id: string) => {
  return RowLink(`${EXPLORER_URL}transaction/${id}`, getShortHash(id), true)
};

export const columns: ColumnDef<NcHistoryItem>[] = [{
  accessorKey: 'title',
  header: () => TableHeader('title'),
  cell: ({ row }) => RowLink(`/bet/${row.getValue('id')}`, row.getValue('title')),
}, {
  accessorKey: 'id',
  header: () => TableHeader('id'),
  cell: ({ row }) => RowTransactionId(row.getValue('id')),
}, {
  accessorKey: 'createdAt',
  header: (header: HeaderContext<NcHistoryItem, unknown>) => SortableTableHeader('createdAt', header.column),
  cell: ({ row }) => RowText(row.getValue('createdAt')),
}];
