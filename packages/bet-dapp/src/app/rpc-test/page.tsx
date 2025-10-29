import { notFound } from 'next/navigation';
import RpcTestClient from './page.client';

export default function RpcTestPage() {
  // Check if TEST_ENV environment variable is set to "true"
  if (process.env.TEST_ENV !== 'true') {
    notFound();
  }

  return <RpcTestClient />;
}
