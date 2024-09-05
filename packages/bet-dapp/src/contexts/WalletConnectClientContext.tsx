import Client from '@walletconnect/sign-client';
import { PairingTypes, SessionTypes } from '@walletconnect/types';
import { Web3Modal } from '@web3modal/standalone';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';

import {
  DEFAULT_APP_METADATA,
  DEFAULT_LOGGER,
  DEFAULT_PROJECT_ID,
  DEFAULT_RELAY_URL,
} from '../constants';
import { getSdkError } from '@walletconnect/utils';
import { get } from 'lodash';

/**
 * Types
 */
interface IContext {
  client: Client | undefined;
  session: SessionTypes.Struct | undefined;
  connect: (pairing?: { topic: string }) => Promise<void>;
  disconnect: () => Promise<void>;
  isInitializing: boolean;
  chains: string[];
  relayerRegion: string;
  pairings: PairingTypes.Struct[];
  accounts: string[];
  setChains: any;
  setRelayerRegion: any;
  getFirstAddress: () => string;
}

/**
 * Context
 */
export const WalletConnectClientContext = createContext<IContext>({} as IContext);

/**
 * Web3Modal Config
 */
const web3Modal = new Web3Modal({
  projectId: DEFAULT_PROJECT_ID,
  themeMode: 'dark',
  walletConnectVersion: 2,
});

/**
 * Provider
 */
export function WalletConnectClientContextProvider({
  children,
}: {
  children: ReactNode | ReactNode[];
}) {
  const [client, setClient] = useState<Client>();
  const [pairings, setPairings] = useState<PairingTypes.Struct[]>([]);
  const [session, setSession] = useState<SessionTypes.Struct>();

  const [isInitializing, setIsInitializing] = useState(false);
  const prevRelayerValue = useRef<string>('');

  const [accounts, setAccounts] = useState<string[]>([]);
  const [chains, setChains] = useState<string[]>([]);
  const [relayerRegion, setRelayerRegion] = useState<string>(
    DEFAULT_RELAY_URL!
  );

  const reset = () => {
    setSession(undefined);
    setAccounts([]);
    setChains([]);
    setRelayerRegion(DEFAULT_RELAY_URL!);
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

  const connect = useCallback(
    async (pairing: any) => {
      if (typeof client === 'undefined') {
        console.error('WalletConnect is not initialized');

        return;
      }

      if (session != null) {
        // Session already exists, return success
        return;
      }

      try {
        const requiredNamespaces = {
          'hathor': {
            methods: ['htr_signWithAddress', 'htr_sendNanoContractTx'],
            chains: ['hathor:testnet'],
            events: [],
          }
        }

        const { uri, approval } = await client.connect({
          pairingTopic: pairing?.topic,
          requiredNamespaces,
        });

        // Open QRCode modal if a URI was returned (i.e. we're not connecting an existing pairing).
        if (uri) {
          // Create a flat array of all requested chains across namespaces.
          const standaloneChains = Object.values(requiredNamespaces)
            .map((namespace) => namespace.chains)
            .flat() as string[];

          web3Modal.openModal({ uri, standaloneChains });
        }

        const session = await approval();
        await onSessionConnected(session);
        // Update known pairings after session is connected.
        setPairings(client.pairing.getAll({ active: true }));
      } catch (e) {
        console.error(e);
        // ignore rejection
      } finally {
        // close modal in case it was open
        web3Modal.closeModal();
      }
    },
    [client, session, onSessionConnected]
  );

  const disconnect = useCallback(async () => {
    if (typeof client === 'undefined') {
      throw new Error('WalletConnect is not initialized');
    }
    if (typeof session === 'undefined') {
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
      // Reset app state after disconnect.
      reset();
    }
  }, [client, session]);

  const _subscribeToEvents = useCallback(
    async (_client: Client) => {
      if (typeof _client === 'undefined') {
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
      if (typeof _client === 'undefined') {
        throw new Error('WalletConnect is not initialized');
      }
      // populates existing pairings to state
      setPairings(_client.pairing.getAll({ active: true }));

      if (typeof session !== 'undefined') return;
      // populates (the last) existing session to state
      if (_client.session.length) {
        const lastKeyIndex = _client.session.keys.length - 1;
        const _session = _client.session.get(
          _client.session.keys[lastKeyIndex]
        );
        await onSessionConnected(_session);
        return _session;
      }
    },
    [session, onSessionConnected]
  );

  const createClient = useCallback(async () => {
    try {
      setIsInitializing(true);

      const _client = await Client.init({
        logger: DEFAULT_LOGGER,
        relayUrl: relayerRegion,
        projectId: DEFAULT_PROJECT_ID,
        metadata: DEFAULT_APP_METADATA,
      });

      setClient(_client);
      prevRelayerValue.current = relayerRegion;
      await _subscribeToEvents(_client);
      await _checkPersistedState(_client);
    } catch (err) {
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, [_checkPersistedState, _subscribeToEvents, relayerRegion]);

  useEffect(() => {
    if (!client || prevRelayerValue.current !== relayerRegion) {
      createClient();
    }
  }, [client, createClient, relayerRegion]);

  const value = useMemo(
    () => ({
      pairings,
      isInitializing,
      accounts,
      chains,
      relayerRegion,
      client,
      session,
      connect,
      getFirstAddress,
      disconnect,
      setChains,
      setRelayerRegion,
    }),
    [
      getFirstAddress,
      pairings,
      isInitializing,
      accounts,
      chains,
      relayerRegion,
      client,
      session,
      connect,
      disconnect,
      setChains,
      setRelayerRegion,
    ]
  );

  return (
    <WalletConnectClientContext.Provider
      value={{
        ...value,
      }}
    >
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