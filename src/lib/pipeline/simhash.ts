import crypto from 'crypto';

interface Vector {
  [key: string]: number;
}

function normalizeText(text: string): string {
  // Convert to lowercase
  let normalized = text.toLowerCase();

  // Remove punctuation and special characters, keep spaces
  normalized = normalized.replace(/[^\w\s]/g, ' ');

  // Normalize whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

function tokenize(text: string): string[] {
  const normalized = normalizeText(text);

  // Split into words (unigrams) and 2-grams for better similarity detection
  const words = normalized.split(/\s+/);
  const tokens: string[] = [];

  // Add individual words
  tokens.push(...words);

  // Add 2-grams
  for (let i = 0; i < words.length - 1; i++) {
    tokens.push(`${words[i]} ${words[i + 1]}`);
  }

  return tokens;
}

function hashToken(token: string): bigint {
  const hash = crypto.createHash('sha256').update(token).digest();
  // Convert first 8 bytes to a BigInt
  return BigInt(`0x${hash.slice(0, 8).toString('hex')}`);
}

function tokenToVector(tokens: string[]): Vector {
  const vector: Vector = {};

  for (let i = 0; i < 64; i++) {
    vector[i] = 0;
  }

  for (const token of tokens) {
    const hash = hashToken(token);
    for (let i = 0; i < 64; i++) {
      // Check if bit i is set in hash
      const bitSet = (hash >> BigInt(i)) & BigInt(1);
      if (bitSet === BigInt(1)) {
        vector[i]++;
      } else {
        vector[i]--;
      }
    }
  }

  return vector;
}

export function computeSimHash(text: string): string {
  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return '0'.repeat(64);
  }

  const vector = tokenToVector(tokens);

  // Generate fingerprint by checking which dimensions are positive
  let fingerprint = '';
  for (let i = 0; i < 64; i++) {
    fingerprint += vector[i] > 0 ? '1' : '0';
  }

  return fingerprint;
}

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    // Pad shorter hash with zeros
    const maxLen = Math.max(hash1.length, hash2.length);
    hash1 = hash1.padEnd(maxLen, '0');
    hash2 = hash2.padEnd(maxLen, '0');
  }

  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }

  return distance;
}

export function isDuplicate(hash1: string, hash2: string, threshold: number = 3): boolean {
  const distance = hammingDistance(hash1, hash2);
  return distance <= threshold;
}
