import Client from '@walletconnect/sign-client';
import {
  DEFAULT_APP_METADATA,
  DEFAULT_LOGGER,
  DEFAULT_PROJECT_ID,
  DEFAULT_RELAY_URL,
} from '@/constants';

let client: Client | null = null;

export async function initializeClient(): Promise<Client> {
  if (client) {
    return client;
  }

  try {
    client = await Client.init({
      logger: DEFAULT_LOGGER,
      relayUrl: DEFAULT_RELAY_URL,
      projectId: DEFAULT_PROJECT_ID,
      metadata: DEFAULT_APP_METADATA,
    });
    return client;
  } catch (error) {
    console.error('Failed to initialize WalletConnect client:', error);
    throw error;
  }
}

export function getClient(): Client {
  if (!client) {
    throw new Error('WalletConnect client is not initialized');
  }
  return client;
}
