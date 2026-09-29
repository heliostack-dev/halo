// Session tokens: 256 random bits in the cookie, HMAC-SHA256(secret, token) in the database.
// A leaked sessions table cannot be replayed without SESSION_SECRET. Web Crypto only.

const encoder = new TextEncoder()

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  return Buffer.from(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)).toString('base64url')
}

export function newToken(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)))
}

const keys = new Map<string, Promise<CryptoKey>>()

function key(secret: string): Promise<CryptoKey> {
  let k = keys.get(secret)
  if (!k) {
    k = crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    keys.set(secret, k)
  }
  return k
}

export async function hashToken(token: string, secret: string): Promise<string> {
  return base64url(await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(token)))
}
