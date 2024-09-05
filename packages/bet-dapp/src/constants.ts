export const HATHOR_MAINNET_CHAIN = null;
export const HATHOR_TESTNET_CHAIN = 'hathor:testnet';

export const DEFAULT_PROJECT_ID = process.env.NEXT_PUBLIC_PROJECT_ID || '8264fff563181da658ce64ee80e80458';
export const DEFAULT_RELAY_URL = process.env.NEXT_PUBLIC_RELAY_URL || 'wss://relay.walletconnect.com';
export const URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
export const FULLNODE_URL = process.env.NEXT_PUBLIC_FULLNODE_URL || 'https://node1.nano-testnet.hathor.network/v1a/';

export const DEFAULT_LOGGER = 'debug';

export const DEFAULT_APP_METADATA = {
  name: 'Hathor Bet',
  description: 'Create your Bet Nano Contract',
  url: 'https://hathor.network/betting2024',
  icons: ['https://hathor-public-files.s3.amazonaws.com/hathor-demo-icon.png'],
};

export enum DEFAULT_HATHOR_METHODS {
  HATHOR_SIGN_MESSAGE = 'htr_signWithAddress',
  HATHOR_SEND_NANO_TX = 'htr_sendNanoContractTx'
}

export enum DEFAULT_HATHOR_EVENTS {}

export const BET_BLUEPRINT = '3cb032600bdf7db784800e4ea911b10676fa2f67591f82bb62628c234e771595';
export const NETWORK = 'testnet';

export const EXPLORER_URL = 'https://explorer.alpha.nano-testnet.hathor.network/';

export const EVENT_TOKEN = '00000008ff7c8af2f3ea120b7a3bab5788f917d320ccc98098445bc1ef78ecca';
export const EVENT_TOKEN_SYMBOL = 'EVC';

export const WAIT_CONFIRMATION_MAX_RETRIES = 800;
