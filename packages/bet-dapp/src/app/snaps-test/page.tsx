import { notFound } from 'next/navigation';
import SnapsTestClient from './page.client';

export default function SnapsTestPage() {
  // Check if SNAP_TEST environment variable is set to "true"
  if (process.env.SNAP_TEST !== 'true') {
    notFound();
  }

  return <SnapsTestClient />;
}
