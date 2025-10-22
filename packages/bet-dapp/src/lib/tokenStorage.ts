/**
 * Token Storage utility for managing known tokens in localStorage
 */

export interface KnownToken {
  id: string;
  name: string;
  symbol: string;
  lastUsed?: number;
}

const STORAGE_KEY = 'hathor_known_tokens';

/**
 * Get all known tokens from localStorage
 */
export function getKnownTokens(): KnownToken[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load known tokens:', error);
    return [];
  }
}

/**
 * Save a token to known tokens list
 */
export function saveKnownToken(token: KnownToken): void {
  try {
    const tokens = getKnownTokens();
    const existingIndex = tokens.findIndex(t => t.id === token.id);
    
    if (existingIndex >= 0) {
      // Update existing token
      tokens[existingIndex] = {
        ...tokens[existingIndex],
        ...token,
        lastUsed: Date.now(),
      };
    } else {
      // Add new token
      tokens.push({
        ...token,
        lastUsed: Date.now(),
      });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Failed to save known token:', error);
  }
}

/**
 * Get token IDs as an array (for use in getBalance params)
 */
export function getKnownTokenIds(): string[] {
  return getKnownTokens().map(token => token.id);
}

/**
 * Remove a token from known tokens
 */
export function removeKnownToken(tokenId: string): void {
  try {
    const tokens = getKnownTokens();
    const filtered = tokens.filter(t => t.id !== tokenId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove known token:', error);
  }
}

/**
 * Clear all known tokens
 */
export function clearKnownTokens(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear known tokens:', error);
  }
}

