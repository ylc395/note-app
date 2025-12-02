export async function getHash(data: ArrayBuffer) {
  // Web Crypto API is available on both browser and nodejs
  // copy from https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API/Non-cryptographic_uses_of_subtle_crypto
  const hash = await crypto.subtle.digest('SHA-256', data);
  const uint8ViewOfHash = new Uint8Array(hash);

  const hashAsString = Array.from(uint8ViewOfHash)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashAsString;
}

export function toArrayBuffer(buffer: Buffer | Uint8Array) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}

export function toText(buffer: ArrayBuffer) {
  const textDecoder = new TextDecoder();
  return textDecoder.decode(buffer);
}
