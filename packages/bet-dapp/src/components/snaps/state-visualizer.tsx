/**
 * State Visualizer Component
 *
 * This component displays the stored wallet state data including addresses, balances,
 * network info, xpub, UTXOs, and transactions.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, ChevronDown, ChevronRight, ArrowUpRight, Loader2 } from 'lucide-react';
import { WalletState, UtxoData } from '@/contexts/WalletStateContext';

interface StateVisualizerProps {
  walletState: WalletState;
  clearWalletState: () => void;
  clearUtxos: () => void;
  handleFetchUtxosForToken: (tokenId: string) => Promise<void>;
  handleUseUtxoAsInput: (utxo: UtxoData) => void;
  handleGetXpub: () => Promise<void>;
  getTokenInfo: (tokenId: string) => { name: string; symbol: string } | null;
  expandedTxs: Set<string>;
  toggleTxExpansion: (hash: string) => void;
  loadingTokenUtxos: Set<string>;
  isExecutingMethod: boolean;
  getSnapChangeNetwork: () => Promise<void>;
  getSnapAddress: (index: number) => Promise<void>;
}

export const StateVisualizer: React.FC<StateVisualizerProps> = ({
  walletState,
  clearWalletState,
  clearUtxos,
  handleFetchUtxosForToken,
  handleUseUtxoAsInput,
  handleGetXpub,
  getTokenInfo,
  expandedTxs,
  toggleTxExpansion,
  loadingTokenUtxos,
  isExecutingMethod,
  getSnapChangeNetwork,
  getSnapAddress,
}) => {
  const hasWalletData =
    walletState.addresses.size > 0 ||
    walletState.balances.size > 0 ||
    walletState.utxos.length > 0 ||
    walletState.network !== null ||
    walletState.xpub !== null ||
    walletState.transactions.size > 0;

	const [isXpubLoading, setIsXpubLoading] = React.useState(false);

	// Loading state for requesting the next address
	const [isAddressLoading, setIsAddressLoading] = React.useState(false);

  if (!hasWalletData) {
    return null;
  }

	const handleGetXpubClick = async () => {
		setIsXpubLoading(true);
		await handleGetXpub()
		setIsXpubLoading(false);
	}

	const handleRequestNextAddressClick = async () => {
		setIsAddressLoading(true);
		try {
			const indices = Array.from(walletState.addresses.values()).map(a => a.index);
			const nextIndex = indices.length > 0 ? Math.max(...indices) + 1 : 0;
			await getSnapAddress(nextIndex);
		} finally {
			setIsAddressLoading(false);
		}
	}

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-hathor-yellow-500">Stored Wallet Data</h2>
        <Button
          onClick={clearWalletState}
          variant="outline"
          size="sm"
          className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
        >
          Clear All Data
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">

	      {/* Network */}
	      {walletState.network && (
		      <Card className="p-4">
			      <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">Network</h3>
			      <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
				      <div className="space-y-1">
					      <div className="flex items-center justify-between">
						      <span className="text-sm text-gray-400">Current Network:</span>
						      <span className="text-sm font-semibold text-hathor-yellow-400">
                    {walletState.network.network}
                  </span>
					      </div>
					      {walletState.network.genesisHash && (
						      <div className="flex items-start justify-between gap-2">
							      <span className="text-xs text-gray-500 flex-shrink-0">Genesis Hash:</span>
							      <span className="text-xs font-mono text-gray-500 break-all text-right">
                      {walletState.network.genesisHash}
                    </span>
						      </div>
					      )}
					      {walletState.network.network !== 'testnet' && (
						      <div className="pt-2 border-t border-gray-700/50">
							      <Button
								      onClick={() => getSnapChangeNetwork()}
								      disabled={isExecutingMethod}
								      size="sm"
								      variant="outline"
								      className="w-full border-hathor-yellow-500/50 text-hathor-yellow-400 hover:bg-hathor-yellow-500/10 hover:text-hathor-yellow-300"
							      >
								      Switch to Testnet
							      </Button>
						      </div>
					      )}
					      <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
						      <span className="text-xs text-gray-500">Last updated:</span>
						      <span className="text-xs text-gray-500">
                    {new Date(walletState.network.lastUpdated).toLocaleTimeString()}
                  </span>
					      </div>
				      </div>
			      </div>
		      </Card>
	      )}

	      {/* Xpub */}
	      <Card className="p-4">
		      <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">Extended Public Key</h3>
		      <div className="bg-gray-900/50 border border-gray-700 rounded p-3">
			      {walletState.xpub && (
				      <div className="space-y-1">
					      <div className="flex items-start justify-between gap-2">
						      <span className="text-sm text-gray-400 flex-shrink-0">Xpub:</span>
						      <div className="flex items-start gap-1.5 min-w-0">
							      <button
								      onClick={() => navigator.clipboard.writeText(walletState.xpub!.xpub)}
								      className="text-gray-400 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
								      title="Copy to clipboard"
							      >
								      <Copy className="h-3 w-3" />
							      </button>
							      <span className="text-xs font-mono text-gray-300 break-all text-right">
                    {walletState.xpub.xpub}
                  </span>
						      </div>
					      </div>
					      <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
						      <span className="text-xs text-gray-500">Last updated:</span>
						      <span className="text-xs text-gray-500">
                  {new Date(walletState.xpub.lastUpdated).toLocaleTimeString()}
                </span>
					      </div>
				      </div>
			      )}
			      {!walletState.xpub && (
				      <div className="space-y-1">
					      <div className="text-sm text-gray-500">No extended public key stored.</div>
					      <div className="pt-2 border-t border-gray-700/50">
						      <Button
							      onClick={handleGetXpubClick}
							      disabled={isExecutingMethod}
							      size="sm"
							      variant="outline"
							      className="w-full border-hathor-yellow-500/50 text-hathor-yellow-400 hover:bg-hathor-yellow-500/10 hover:text-hathor-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
						      >
							      {isXpubLoading ? (
								      <>
									      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
									      Fetching...
								      </>
							      ) : (
								      'Fetch xPub for Wallet'
							      )}
						      </Button>
					      </div>
				      </div>
			      )}
		      </div>
	      </Card>

			</div>

	    <hr className="border-t border-gray-700/50 my-4" />

	    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Addresses */}
        {walletState.addresses.size > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">Addresses</h3>
            <div className="space-y-3">
              {Array.from(walletState.addresses.values()).map((addressData) => (
                <div
                  key={addressData.index}
                  className="bg-gray-900/50 border border-gray-700 rounded p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Index:</span>
                      <span className="text-sm font-mono text-gray-300">{addressData.index}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-400 flex-shrink-0">Address:</span>
                      <div className="flex items-start gap-1.5 min-w-0">
                        <button
                          onClick={() => navigator.clipboard.writeText(addressData.address)}
                          className="text-gray-400 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-mono text-gray-300 break-all text-right">
                          {addressData.address}
                        </span>
                      </div>
                    </div>
                    {addressData.addressPath && (
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm text-gray-400 flex-shrink-0">Path:</span>
                        <span className="text-xs font-mono text-gray-500 break-all text-right">
                          {addressData.addressPath}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                      <span className="text-xs text-gray-500">Last updated:</span>
                      <span className="text-xs text-gray-500">
                        {new Date(addressData.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {/* CTA Card for requesting next address */}
              <div className="bg-gray-900/50 border border-dashed border-hathor-yellow-500 rounded p-3 flex flex-col items-center justify-center">
                <span className="text-sm text-gray-400 mb-2">Need another address?</span>
                <Button
                  variant="outline"
                  className="text-hathor-yellow-500 border-hathor-yellow-500 hover:bg-hathor-yellow-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isExecutingMethod}
                  onClick={handleRequestNextAddressClick}
                >
                  {isAddressLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Requesting address {walletState.addresses.size}...
                    </>
                  ) : (
                    `Request Next Address (Index ${walletState.addresses.size})`
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Balances */}
        {walletState.balances.size > 0 && (
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">Balances</h3>
            <div className="space-y-3">
              {Array.from(walletState.balances.values()).map((balanceData) => (
                <div
                  key={balanceData.token.id}
                  className="bg-gray-900/50 border border-gray-700 rounded p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-400 flex-shrink-0">Token:</span>
                      <span className="text-sm font-mono text-gray-300 break-all text-right">
                        {balanceData.token.symbol} ({balanceData.token.name})
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs text-gray-500 flex-shrink-0">Token ID:</span>
                      <div className="flex items-start gap-1.5 min-w-0">
                        <button
                          onClick={() => navigator.clipboard.writeText(balanceData.token.id)}
                          className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-mono text-gray-500 break-all text-right">
                          {balanceData.token.id}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Unlocked:</span>
                      <span className="text-sm font-mono text-green-400">{balanceData.balance.unlocked}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Locked:</span>
                      <span className="text-sm font-mono text-orange-400">{balanceData.balance.locked}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Transactions:</span>
                      <span className="text-sm font-mono text-gray-300">{balanceData.transactions}</span>
                    </div>
                    {(balanceData.tokenAuthorities.unlocked.mint || balanceData.tokenAuthorities.unlocked.melt) && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Authorities:</span>
                        <span className="text-xs font-mono text-blue-400">
                          {balanceData.tokenAuthorities.unlocked.mint && 'MINT '}
                          {balanceData.tokenAuthorities.unlocked.melt && 'MELT'}
                        </span>
                      </div>
                    )}

                    {/* Fetch UTXOs button */}
                    <div className="pt-2 border-t border-gray-700/50">
                      <Button
                        onClick={() => handleFetchUtxosForToken(balanceData.token.id)}
                        disabled={loadingTokenUtxos.has(balanceData.token.id) || isExecutingMethod}
                        size="sm"
                        variant="outline"
                        className="w-full border-hathor-yellow-500/50 text-hathor-yellow-400 hover:bg-hathor-yellow-500/10 hover:text-hathor-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingTokenUtxos.has(balanceData.token.id) ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Fetching...
                          </>
                        ) : (
                          'Fetch UTXOs for Token'
                        )}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                      <span className="text-xs text-gray-500">Last updated:</span>
                      <span className="text-xs text-gray-500">
                        {new Date(balanceData.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* UTXOs */}
        {walletState.utxos.length > 0 && (
          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-hathor-yellow-500">
                UTXOs ({walletState.utxos.length})
              </h3>
              <Button
                onClick={clearUtxos}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
              >
                Clear UTXOs
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {walletState.utxos.map((utxo, idx) => (
                <div
                  key={`${utxo.txId}-${utxo.index}-${idx}`}
                  className="bg-gray-900/50 border border-gray-700 rounded p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-400 flex-shrink-0">TX ID:</span>
                      <div className="flex items-start gap-1.5 min-w-0">
                        <button
                          onClick={() => navigator.clipboard.writeText(utxo.txId)}
                          className="text-gray-300 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-mono text-gray-300 break-all text-right">
                          {utxo.txId}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Index:</span>
                      <span className="text-sm font-mono text-gray-300">{utxo.index}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Value:</span>
                      <span className={`text-sm font-mono ${utxo.locked ? 'text-orange-400' : 'text-green-400'}`}>
                        {utxo.value}{utxo.locked && ' (Locked)'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-400 flex-shrink-0">Token:</span>
                      {(() => {
                        const tokenInfo = getTokenInfo(utxo.token);
                        if (tokenInfo) {
                          return (
                            <span className="text-sm font-mono text-gray-300 break-all text-right">
                              {tokenInfo.symbol} ({tokenInfo.name})
                            </span>
                          );
                        } else {
                          return (
                            <div className="flex items-start gap-1.5 min-w-0">
                              <button
                                onClick={() => navigator.clipboard.writeText(utxo.token)}
                                className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
                                title="Copy to clipboard"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-mono text-gray-500 break-all text-right">
                                {utxo.token}
                              </span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-gray-400 flex-shrink-0">Address:</span>
                      <div className="flex items-start gap-1.5 min-w-0">
                        <button
                          onClick={() => navigator.clipboard.writeText(utxo.address)}
                          className="text-gray-400 hover:text-hathor-yellow-400 transition-colors flex-shrink-0 mt-0.5"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-mono text-gray-500 break-all text-right">
                          {utxo.address}
                        </span>
                      </div>
                    </div>

                    {/* Use UTXO button */}
                    <div className="pt-2 border-t border-gray-700/50">
                      <Button
                        onClick={() => handleUseUtxoAsInput(utxo)}
                        disabled={utxo.locked}
                        size="sm"
                        variant="outline"
                        className="w-full border-hathor-yellow-500/50 text-hathor-yellow-400 hover:bg-hathor-yellow-500/10 hover:text-hathor-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Use as Input
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Transactions */}
        {walletState.transactions.size > 0 && (
          <Card className="p-4 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-3 text-hathor-yellow-500">
              Transactions ({walletState.transactions.size})
            </h3>
            <div className="space-y-3">
              {Array.from(walletState.transactions.values()).map((tx) => {
                const isExpanded = expandedTxs.has(tx.hash);
                return (
                  <div
                    key={tx.hash}
                    className="bg-gray-900/50 border border-gray-700 rounded"
                  >
                    {/* Compact Header */}
                    <div
                      className="p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
                      onClick={() => toggleTxExpansion(tx.hash)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="text-sm text-gray-400 flex-shrink-0">TX:</span>
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(tx.hash);
                              }}
                              className="text-gray-300 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
                              title="Copy to clipboard"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-mono text-gray-300 break-all">
                              {tx.hash}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {new Date(tx.timestamp * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-700 p-3 space-y-3">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Version:</span>
                            <span className="text-gray-300 font-mono">{tx.version}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Weight:</span>
                            <span className="text-gray-300 font-mono">{tx.weight.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Nonce:</span>
                            <span className="text-gray-300 font-mono">{tx.nonce}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Signal Bits:</span>
                            <span className="text-gray-300 font-mono">{tx.signalBits}</span>
                          </div>
                        </div>

                        {/* Parents */}
                        {tx.parents.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">Parents:</div>
                            <div className="space-y-1">
                              {tx.parents.map((parent, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => navigator.clipboard.writeText(parent)}
                                    className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
                                    title="Copy to clipboard"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                  <span className="text-xs font-mono text-gray-500 break-all">
                                    {parent}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Inputs */}
                        {tx.inputs.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">
                              Inputs ({tx.inputs.length}):
                            </div>
                            <div className="space-y-2">
                              {tx.inputs.map((input, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gray-800/50 rounded p-2 space-y-1"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-gray-500">Hash:</span>
                                    <button
                                      onClick={() => navigator.clipboard.writeText(input.hash)}
                                      className="text-gray-500 hover:text-hathor-yellow-400 transition-colors flex-shrink-0"
                                      title="Copy to clipboard"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                    <span className="text-xs font-mono text-gray-400 break-all">
                                      {input.hash}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Index: <span className="text-gray-400">{input.index}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Outputs */}
                        {tx.outputs.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">
                              Outputs ({tx.outputs.length}):
                            </div>
                            <div className="space-y-2">
                              {tx.outputs.map((output, idx) => (
                                <div
                                  key={idx}
                                  className="bg-gray-800/50 rounded p-2 space-y-1"
                                >
                                  <div className="text-xs text-gray-500">
                                    Value: <span className="text-green-400 font-mono">{output.value}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Token Data: <span className="text-gray-400">{output.tokenData}</span>
                                  </div>
                                  {output.decodedScript && (
                                    <div className="text-xs text-gray-500">
                                      Script: <span className="text-gray-400">{output.decodedScript}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tokens */}
                        {tx.tokens.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-400 mb-1">
                              Tokens ({tx.tokens.length}):
                            </div>
                            <div className="text-xs font-mono text-gray-500">
                              {JSON.stringify(tx.tokens, null, 2)}
                            </div>
                          </div>
                        )}

                        {/* Last Updated */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
                          <span className="text-xs text-gray-500">Last updated:</span>
                          <span className="text-xs text-gray-500">
                            {new Date(tx.lastUpdated).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </section>
  );
};

