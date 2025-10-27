'use client';

import { SnapTester } from '@/components/snaps/snap-tester';
import { useMetaMaskContext } from 'snap-utils';
import { CheckCircle2 } from 'lucide-react';

export default function SnapsTestPage() {
  const { installedSnap } = useMetaMaskContext();
  const isConnected = installedSnap !== null;

  return (
    <div className="container mx-auto p-4 max-w-[1500px]">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h1 className="text-4xl font-bold font-kuenstler">Snap Testing Interface</h1>

          {/* Connection Status - Top Right */}
          {isConnected && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg flex-shrink-0">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-400 font-medium">
                Connected to Hathor Snap
                {installedSnap?.version && (
                  <span className="ml-1 text-green-500/70 text-xs">
                    (v{installedSnap.version})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        <p className="text-gray-400">Test Hathor Snap methods and view results in real-time</p>
      </div>

      <SnapTester />
    </div>
  );
}
