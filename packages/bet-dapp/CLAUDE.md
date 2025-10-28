# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server at http://localhost:3000
- `npm run build` - Build the application for production (uses experimental build mode)
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Local Development Setup

The application uses Docker for local DynamoDB:
- `docker-compose up -d` - Start local DynamoDB instance on port 8000
- DynamoDB data is persisted in `./dynamodb_data/`

### Environment Variables
- `SNAP_TEST=true` - Enable access to the `/snaps-test` page for testing Hathor Snap methods during development
  - This page is restricted and will return 404 if the environment variable is not set to "true"
  - See `.env.example` for configuration template

## Architecture Overview

This is a Next.js 14 betting dApp that integrates with the Hathor blockchain through nano contracts. Key architectural components:

### Core Technologies
- **Next.js 14** with App Router
- **Hathor Wallet Lib** (@hathor/wallet-lib) for blockchain integration
- **WalletConnect** for wallet connectivity
- **DynamoDB** for application state persistence
- **Tailwind CSS** with custom components using shadcn/ui

### Key Application Flow
1. Users connect wallets via WalletConnect
2. Create betting nano contracts on Hathor testnet
3. Place bets on created contracts
4. Oracle sets results and users withdraw winnings

### Important Configuration
- **Network**: Hathor testnet (`NETWORK = 'testnet'`)
- **Fullnode URL**: `https://hathorplay.bravo.nano-testnet.hathor.network/v1a/`
- **Bet Blueprint**: `0000015ec35e6fa7b333644281eaf42068edac9b4a87149bc837ec6b769c7e2c`
- **Default Token**: HTR (EVENT_TOKEN = '00')

### Main Application Areas
- `/create` - Create new betting nano contracts
- `/bet/[id]` - Place bets on existing contracts
- `/set_result/[id]` - Oracle interface for setting results
- `/results/[id]` - View results and withdraw winnings
- `/all_bets` - View all betting contracts
- `/snaps-test` - Snap testing interface (requires `SNAP_TEST=true` environment variable)

### Context Providers
- `WalletConnectClientContext` - Manages wallet connections and sessions
- `JsonRpcContext` - Handles RPC communication with Hathor network

### Key Libraries and Utilities
- `hathor-rpc-handler-test` - Custom RPC handler for nano contract operations
- `src/lib/api/` - API utilities for nano contract transactions
- `src/lib/dynamodb/` - DynamoDB client and operations
- `src/constants.ts` - Application configuration constants

### Database Structure
Uses DynamoDB with separate tables for:
- Nano contract metadata and betting options
- Transaction history and user interactions

### Styling
- Custom Tailwind configuration with Hathor branding colors
- Custom fonts: KuenstlerGrotesk and Mona-Sans
- Dark theme by default with Egyptian/pharaoh visual theme