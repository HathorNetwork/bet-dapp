import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Client from '@walletconnect/sign-client';
import { PairingTypes, SessionTypes } from '@walletconnect/types';
import { Web3Modal } from '@web3modal/standalone';
import { getSdkError } from '@walletconnect/utils';
import { get } from 'lodash';
import { DEFAULT_PROJECT_ID } from '@/constants';
import { getClient } from './WalletConnectClient';

interface IContext {
  client: Client | undefined;
  session: SessionTypes.Struct | undefined;
  connect: (pairing?: { topic: string }) => Promise<void>;
  disconnect: () => Promise<void>;
  chains: string[];
  pairings: PairingTypes.Struct[];
  accounts: string[];
  setChains: React.Dispatch<React.SetStateAction<string[]>>;
  getFirstAddress: () => string;
}

const WalletConnectClientContext = createContext<IContext>({} as IContext);

const web3Modal = new Web3Modal({
  projectId: DEFAULT_PROJECT_ID,
  themeMode: 'dark',
  walletConnectVersion: 2,
});

export function WalletConnectClientContextProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const [client, setClient] = useState<Client>();
  const [pairings, setPairings] = useState<PairingTypes.Struct[]>([]);
  const [session, setSession] = useState<SessionTypes.Struct>();
  const [accounts, setAccounts] = useState<string[]>([]);
  const [chains, setChains] = useState<string[]>([]);

  const reset = () => {
    setSession(undefined);
    setAccounts([]);
    setChains([]);
  };

  const onSessionConnected = useCallback(
    async (_session: SessionTypes.Struct) => {
      const allNamespaceAccounts = Object.values(_session.namespaces)
        .map((namespace) => namespace.accounts)
        .flat();
      const allNamespaceChains = Object.keys(_session.namespaces);

      setSession(_session);
      setChains(allNamespaceChains);
      setAccounts(allNamespaceAccounts);
    },
    []
  );

  const getFirstAddress = useCallback(() => {
    const [_, _network, addr] = get(session, 'namespaces.hathor.accounts[0]', '::').split(':');
    return addr;
  }, [session]);

  const _subscribeToEvents = useCallback(
    async (_client: Client) => {
      if (!_client) {
        throw new Error('WalletConnect is not initialized');
      }

      _client.on('session_ping', (args) => {
        console.log('EVENT', 'session_ping', args);
      });

      _client.on('session_event', (args) => {
        console.log('EVENT', 'session_event', args);
      });

      _client.on('session_update', ({ topic, params }) => {
        console.log('EVENT', 'session_update', { topic, params });
        const { namespaces } = params;
        const _session = _client.session.get(topic);
        const updatedSession = { ..._session, namespaces };
        onSessionConnected(updatedSession);
      });

      _client.on('session_delete', () => {
        console.log('EVENT', 'session_delete');
        reset();
      });
    },
    [onSessionConnected]
  );

  const _checkPersistedState = useCallback(
    async (_client: Client) => {
      if (!_client) {
        throw new Error('WalletConnect is not initialized');
      }
      setPairings(_client.pairing.getAll({ active: true }));

      if (session) return;
      if (_client.session.length) {
        const lastKeyIndex = _client.session.keys.length - 1;
        const _session = _client.session.get(_client.session.keys[lastKeyIndex]);
        await onSessionConnected(_session);
        return _session;
      }
    },
    [session, onSessionConnected]
  );

  useEffect(() => {
    (async () => {
      const client = getClient();

      await _subscribeToEvents(client);
      await _checkPersistedState(client);
      setClient(client);
    })();
  }, [_subscribeToEvents, _checkPersistedState]);

  const connect = useCallback(
    async (pairing: { topic: string } | undefined) => {
      if (!client) {
        throw new Error('WalletConnect is not initialized');
      }

      if (session) {
        return;
      }

      try {
        const requiredNamespaces = {
          'hathor': {
            methods: ['htr_signWithAddress', 'htr_sendNanoContractTx'],
            chains: ['hathor:testnet'],
            events: [],
          }
        };

        const { uri, approval } = await client.connect({
          pairingTopic: pairing?.topic,
          requiredNamespaces,
        });

        if (uri) {
          const standaloneChains = Object.values(requiredNamespaces)
            .map((namespace) => namespace.chains)
            .flat() as string[];

          web3Modal.openModal({ uri, standaloneChains });
        }

        const session = await approval();
        await onSessionConnected(session);
        setPairings(client.pairing.getAll({ active: true }));
      } catch (e) {
        console.error(e);
      } finally {
        web3Modal.closeModal();
      }
    },
    [client, session, onSessionConnected]
  );

  const disconnect = useCallback(async () => {
    if (!client) {
      throw new Error('WalletConnect is not initialized');
    }
    if (!session) {
      throw new Error('Session is not connected');
    }

    try {
      await client.disconnect({
        topic: session.topic,
        reason: getSdkError('USER_DISCONNECTED'),
      });
    } catch (error) {
      console.error('SignClient.disconnect failed:', error);
    } finally {
      reset();
    }
  }, [client, session]);

  const value = useMemo(
    () => ({
      pairings,
      accounts,
      chains,
      client,
      session,
      connect,
      disconnect,
      getFirstAddress,
      setChains,
    }),
    [
      pairings,
      accounts,
      chains,
      client,
      session,
      connect,
      disconnect,
      getFirstAddress,
      setChains,
    ]
  );

  return (
    <WalletConnectClientContext.Provider value={value}>
      {children}
    </WalletConnectClientContext.Provider>
  );
}

export function useWalletConnectClient() {
  const context = useContext(WalletConnectClientContext);
  if (context === undefined) {
    throw new Error(
      'useWalletConnectClient must be used within a WalletConnectClientContextProvider'
    );
  }
  return context;
}
