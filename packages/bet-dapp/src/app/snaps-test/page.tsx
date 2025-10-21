'use client';

import { SnapTester } from '@/components/snaps/snap-tester';

export default function SnapsTestPage() {
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 font-kuenstler">Snap Testing Interface</h1>
        <p className="text-gray-400">Test Hathor Snap methods and view results in real-time</p>
      </div>

      <SnapTester />
    </div>
  );
}