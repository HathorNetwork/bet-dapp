import Client from '@walletconnect/sign-client';
import {
  DEFAULT_APP_METADATA,
  DEFAULT_LOGGER,
  DEFAULT_PROJECT_ID,
  DEFAULT_RELAY_URL,
} from '@/constants';

class WalletConnectClientSingleton {
  private static instance: WalletConnectClientSingleton | null = null;
  private client: Client | null = null;
  private initializationPromise: Promise<Client> | null = null;

  private constructor() {}

  public static getInstance(): WalletConnectClientSingleton {
    if (!WalletConnectClientSingleton.instance) {
      WalletConnectClientSingleton.instance = new WalletConnectClientSingleton();
    }
    return WalletConnectClientSingleton.instance;
  }

  public async getClient(): Promise<Client> {
    if (this.client) {
      return this.client;
    }

    if (!this.initializationPromise) {
      this.initializationPromise = this.initializeClient();
    }

    return this.initializationPromise;
  }

  private async initializeClient(): Promise<Client> {
    try {
      console.log('Initializing WalletConnect client...');
      this.client = await Client.init({
        logger: DEFAULT_LOGGER,
        relayUrl: DEFAULT_RELAY_URL,
        projectId: DEFAULT_PROJECT_ID,
        metadata: DEFAULT_APP_METADATA,
      });
      console.log('WalletConnect client initialized successfully');
      return this.client;
    } catch (error) {
      console.error('Failed to initialize WalletConnect client:', error);
      this.initializationPromise = null;
      throw error;
    }
  }
}

const singleton = WalletConnectClientSingleton.getInstance();

export default singleton;
