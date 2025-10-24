import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useWalletState } from '@/contexts/WalletStateContext';
import { Copy, ChevronDown, ChevronUp, Trash, DownloadCloud } from 'lucide-react';

export const RequestHistory: React.FC = () => {
  const { walletState, clearRequestHistory } = useWalletState();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'errors' | 'success'>('all');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  const entries = useMemo(() => [...walletState.requestHistory].sort((a, b) => b.timestamp - a.timestamp), [walletState.requestHistory]);

  // Unique methods for quick method filter dropdown
  const uniqueMethods = useMemo(() => {
    const set = new Set<string>();
    entries.forEach(e => set.add(e.method || 'anonymous'));
    return Array.from(set).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(e => !(
      (filterType === 'errors' && !e.error) ||
      (filterType === 'success' && e.error) ||
      (selectedMethod !== 'all' && e.method !== selectedMethod)
    ));
  }, [entries, filterType, selectedMethod]);

  const toggle = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Safe stringify to avoid circular reference errors
  const safeStringify = (obj: any, space?: number) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, function (key, value) {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    }, space);
  };

  // Create a short snippet for results to show in collapsed item view
  const getResultSnippet = (res: any): string => {
    try {
      if (res === undefined) return 'No result';
      if (res === null) return 'null';
      if (typeof res === 'string' || typeof res === 'number' || typeof res === 'boolean') {
        const s = String(res);
        return s.length > 80 ? `${s.slice(0, 80)}…` : s;
      }
      if (Array.isArray(res)) {
        if (res.length === 0) return '[]';
        const first = res[0];
        const firstSnippet = getResultSnippet(first);
        return `[Array(${res.length})] ${firstSnippet}`;
      }
      if (typeof res === 'object') {
        const keys = Object.keys(res);
        if (keys.length === 0) return '{}';
        const parts = keys.slice(0, 3).map((k) => {
          const v = (res as any)[k];
          let vs: string;
          if (v === null) vs = 'null';
          else if (v === undefined) vs = 'undefined';
          else if (typeof v === 'object') {
            if (Array.isArray(v)) vs = `[${v.length} items]`;
            else vs = '{...}';
          } else {
            vs = String(v);
            if (vs.length > 30) vs = `${vs.slice(0, 30)}…`;
          }
          return `${k}: ${vs}`;
        });
        return `{ ${parts.join(', ')} }`;
      }
      return String(res).slice(0, 80);
    } catch (err) {
      return '[unavailable]';
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy request entry:', err);
    }
  };

  const exportToJson = () => {
    try {
      const json = safeStringify(filteredEntries, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      a.download = `request-history-${ts}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export request history to JSON:', err);
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
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-300">Request history is collapsed.</div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-400">{entries.length} item{entries.length !== 1 ? 's' : ''}</div>
              <Button size="sm" variant="ghost" onClick={() => setCollapsed(false)}>
                <ChevronDown className="h-4 w-4 mr-1" /> Expand
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
              {/* Quick filters */}
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="bg-gray-800 border border-gray-700 text-xs text-gray-200 p-1 rounded font-mono"
                  title="Filter by outcome"
                >
                  <option value="all">All</option>
                  <option value="errors">Errors</option>
                  <option value="success">Success</option>
                </select>

                <select
                  value={selectedMethod}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-xs text-gray-200 p-1 rounded font-mono"
                  title="Filter by method"
                >
                  <option value="all">All methods</option>
                  {uniqueMethods.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                <Button size="sm" variant="ghost" onClick={exportToJson} title="Export visible history to JSON">
                  <DownloadCloud className="h-4 w-4 mr-1" /> Export
                </Button>

                <Button size="sm" variant="ghost" className="text-red-400" onClick={clearRequestHistory}>
                  <Trash className="h-4 w-4 mr-1" /> Clear History
                </Button>
              </div>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-sm text-gray-400">No requests recorded for the current filters.</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
              {filteredEntries.map((e) => (
                <div key={e.id} className="border border-gray-700 rounded p-3 bg-gray-900/20">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0" onClick={() => toggle(e.id)}>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm text-gray-200 truncate">{e.method}</div>
                        <div className="text-xs text-gray-400 font-mono">{new Date(e.timestamp).toLocaleString()}</div>
                        {(e.error) && <div className="ml-2 text-red-400 text-xs">Error</div>}
                      </div>
                      <div className="text-xs text-gray-400 mt-2 break-words">Args: <span className="font-mono text-xs text-gray-300">{safeStringify(e.args)}</span></div>
                      {!expanded[e.id] && (() => {
                        // Prefer showing errorObject when available for errored requests with null/undefined result
                        const displaySource = (!e.result && e.errorObject) ? e.errorObject : e.result;
                        return (
                          <div className={`${e.error ? 'text-red-300' : 'text-gray-300'} text-xs mt-1 break-words`}>{e.error? 'Error' : 'Result'}: <span className="font-mono text-xs">{getResultSnippet(displaySource)}</span></div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(safeStringify({ method: e.method, args: e.args, result: e.result, errorObject: e.errorObject }))}
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
                    <div className="mt-3 text-sm text-gray-300 font-mono whitespace-pre-wrap" onClick={() => toggle(e.id)}>
                      <div className="mb-2"><strong>Result / Error:</strong></div>
                      {/* Prefer showing detailed errorObject when available */}
                      {e.errorObject && (
                        <pre className="text-xs p-2 bg-gray-900/40 rounded overflow-auto">{safeStringify(e.errorObject, 2)}</pre>
                      )}
	                    <div className="mb-2"><strong>Result:</strong></div>
                      <pre className="text-xs p-2 bg-gray-900/40 rounded overflow-auto">{typeof e.result === 'string' ? e.result : safeStringify(e.result, 2)}</pre>
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
