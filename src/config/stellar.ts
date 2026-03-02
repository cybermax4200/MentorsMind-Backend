import * as StellarSdk from '@stellar/stellar-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Determine network
const isTestnet = process.env.STELLAR_NETWORK === 'testnet';

// Configure Stellar SDK
export const server = new StellarSdk.Horizon.Server(
  process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
);

export const networkPassphrase = isTestnet
  ? StellarSdk.Networks.TESTNET
  : StellarSdk.Networks.PUBLIC;

// Platform wallet keypair (for receiving fees)
export const getPlatformKeypair = (): StellarSdk.Keypair | null => {
  const secretKey = process.env.PLATFORM_SECRET_KEY;
  if (!secretKey) {
    console.warn('⚠️  Platform secret key not configured');
    return null;
  }
  return StellarSdk.Keypair.fromSecret(secretKey);
};

// Test Stellar connection
export const testStellarConnection = async (): Promise<boolean> => {
  try {
    await server.ledgers().limit(1).call();
    console.log(`✅ Stellar ${isTestnet ? 'Testnet' : 'Mainnet'} connected successfully`);
    return true;
  } catch (error) {
    console.error('❌ Stellar connection failed:', error);
    return false;
  }
};

export { StellarSdk };
