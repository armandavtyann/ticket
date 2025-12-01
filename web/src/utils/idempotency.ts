export async function generateIdempotencyKey(
  userId: string,
  type: string,
  payload: any
): Promise<string> {
  // Sort ticket IDs to ensure consistent key generation
  const sortedPayload = {
    ...payload,
    ticketIds: payload.ticketIds ? [...payload.ticketIds].sort() : payload.ticketIds,
  };
  
  const payloadString = JSON.stringify(sortedPayload);
  const keyString = `${userId}:${type}:${payloadString}`;
  
  // Use Web Crypto API for SHA-256 hashing (matches backend implementation)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for environments without Web Crypto API
  let hash = 0;
  for (let i = 0; i < keyString.length; i++) {
    const char = keyString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive hex string
  return Math.abs(hash).toString(16);
}

export async function getIdempotencyKey(
  userId: string,
  type: string,
  payload: any
): Promise<string> {
  const key = await generateIdempotencyKey(userId, type, payload);
  const storageKey = `idempotency:${key}`;
  
  // Store in sessionStorage (cleared when tab closes)
  // This helps track if we've already sent this request
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(storageKey, JSON.stringify({
      userId,
      type,
      payload,
      timestamp: Date.now(),
    }));
  }
  
  return key;
}
