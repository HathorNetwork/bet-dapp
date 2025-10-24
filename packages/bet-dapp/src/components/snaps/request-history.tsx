import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useWalletState } from '@/contexts/WalletStateContext';
import { Copy, ChevronDown, ChevronUp, Trash } from 'lucide-react';

export const RequestHistory: React.FC = () => {
  const { walletState, clearRequestHistory } = useWalletState();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const entries = useMemo(() => [...walletState.requestHistory].sort((a, b) => b.timestamp - a.timestamp), [walletState.requestHistory]);

  const toggle = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy request entry:', err);
    }
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-2xl font-bold text-hathor-yellow-500">Session Request History</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400 mr-3">{entries.length} item{entries.length !== 1 ? 's' : ''}</div>
          <Button size="sm" variant="ghost" onClick={() => setCollapsed(c => !c)}>
            {collapsed ? (
              <div className="flex items-center gap-2"><ChevronDown className="h-4 w-4" /> Show</div>
            ) : (
              <div className="flex items-center gap-2"><ChevronUp className="h-4 w-4" /> Hide</div>
            )}
          </Button>
        </div>
      </div>

      {collapsed ? (
        // Collapsed view: compact card showing count and quick actions
        <Card className="p-3">
	        <div className="flex items-center justify-between mb-3">
		        <div>
			        <Label className="text-sm font-medium text-gray-300">Recent requests made during this session</Label>
			        <div className="text-xs text-gray-400">Stored in memory only; cleared when you refresh or call Clear History.</div>
		        </div>
		        <div className="flex items-center gap-2">
			        <Button size="sm" variant="ghost" className="text-red-400" onClick={clearRequestHistory}>
				        <Trash className="h-4 w-4 mr-1" /> Clear History
			        </Button>
		        </div>
	        </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <Label className="text-sm font-medium text-gray-300">Recent requests made during this session</Label>
              <div className="text-xs text-gray-400">Stored in memory only; cleared when you refresh or call Clear History.</div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="text-red-400" onClick={clearRequestHistory}>
                <Trash className="h-4 w-4 mr-1" /> Clear History
              </Button>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="text-sm text-gray-400">No requests recorded for this session.</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
              {entries.map((e) => (
                <div key={e.id} className="border border-gray-700 rounded p-3 bg-gray-900/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm text-gray-200 truncate">{e.method}</div>
                        <div className="text-xs text-gray-400 font-mono">{new Date(e.timestamp).toLocaleString()}</div>
                        {e.error && <div className="ml-2 text-red-400 text-xs">Error</div>}
                      </div>
                      <div className="text-xs text-gray-400 mt-2 break-words">Args: <span className="font-mono text-xs text-gray-300">{JSON.stringify(e.args)}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(JSON.stringify({ method: e.method, args: e.args, result: e.result }))}
                        className="text-gray-400 hover:text-hathor-yellow-400"
                        title="Copy JSON"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggle(e.id)}
                        className="text-gray-400 hover:text-gray-200"
                        aria-label="Toggle details"
                      >
                        {expanded[e.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {expanded[e.id] && (
                    <div className="mt-3 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                      <div className="mb-2"><strong>Result / Error:</strong></div>
                      <pre className="text-xs p-2 bg-gray-900/40 rounded overflow-auto">{typeof e.result === 'string' ? e.result : JSON.stringify(e.result, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </section>
  );
};
