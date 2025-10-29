'use client';

import { useState } from 'react';
import { useWalletConnectClient } from '@/contexts/WalletConnectClientContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HATHOR_TESTNET_CHAIN } from '@/constants';
import { jsonStringify } from '@/lib/jsonUtils';

const DEFAULT_REQUEST = {
  method: "htr_sendTransaction",
  params: [{
    outputs: [{
      address: "WewDeXWyvHP79xWtqmYdaS1Y4m4Y5the2N",
      value: 100,
      token: "00"
    }],
    inputs: [],
    change_address: "WewDeXWyvHP79xWtqmYdaS1Y4m4Y5the2N"
  }]
};

export default function RpcPage() {
  const [requestJson, setRequestJson] = useState(JSON.stringify(DEFAULT_REQUEST, null, 2));
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { client, session, connect } = useWalletConnectClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!session) {
      await connect();
      return;
    }

    try {
      // Parse the full request JSON
      const { method, params } = JSON.parse(requestJson);

      // Make the RPC request
      const response = await client!.request({
        topic: session.topic,
        chainId: HATHOR_TESTNET_CHAIN,
        request: {
          method,
          params
        }
      });

      setResult(response);
    } catch (err: any) {
      console.error('Full error:', err);
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">RPC Request Tester</h1>
      
      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="request">Request JSON</Label>
            <Textarea
              id="request"
              value={requestJson}
              onChange={(e) => setRequestJson(e.target.value)}
              className="h-64 font-mono"
              placeholder="Enter your JSON request"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Example format:
              {`
{
  "method": "htr_sendTransaction",
  "params": [{
    "outputs": [{
      "address": "WewDeXWyvHP79xWtqmYdaS1Y4m4Y5the2N",
      "value": 100,
      "token": "00"
    }],
    "inputs": [],
    "change_address": "WewDeXWyvHP79xWtqmYdaS1Y4m4Y5the2N"
  }]
}`}
            </p>
          </div>

          <Button type="submit">
            {session ? 'Send Request' : 'Connect Wallet'}
          </Button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold mb-2">Response:</h2>
            <pre className="bg-white border border-gray-300 p-4 rounded overflow-auto font-mono text-black">
              {jsonStringify(result, true)}
            </pre>
          </div>
        )}
      </Card>
    </div>
  );
} 