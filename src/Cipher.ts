/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 */

/**
 * Shared JOSE/JWE types and the runtime key-agreement contract used by
 * encryption libraries such as `@interop/minimal-cipher` and consumers like
 * `@interop/edv-client`. The structural JWE shapes are typed precisely; the
 * heterogeneous public-key payloads resolved at runtime are left loose (`any`)
 * to accommodate the varied key implementations callers supply.
 */

/**
 * An ephemeral public key, encoded as a JWK.
 */
export interface IEPK {
  kty: string
  crv: string
  x?: string
  [key: string]: unknown
}

/**
 * The JWE recipient header.
 */
export interface IRecipientHeader {
  kid?: string
  alg?: string
  epk?: IEPK
  apu?: string
  apv?: string
  [key: string]: unknown
}

/**
 * A JWE recipient.
 */
export interface IRecipient {
  header: IRecipientHeader
  encrypted_key?: string
  [key: string]: unknown
}

/**
 * A JSON Web Encryption (JWE) object.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7516
 */
export interface IJWE {
  protected: string
  recipients: IRecipient[]
  iv: string
  ciphertext: string
  tag: string
}

/**
 * Resolves a key ID to a Diffie-Hellman public key.
 */
export type IKeyResolver = (options: { id?: string }) => Promise<any>

/**
 * Runtime key agreement key (KAK) contract -- the live API used to derive a
 * shared secret via ECDH. Sits alongside the `ISigner` / `IVerifier` runtime
 * contracts. Implemented by, for example, `X25519KeyAgreementKey2020` and the
 * ECDSA Multikey key pair.
 */
export interface IKeyAgreementKey {
  id: string
  algorithm?: any
  deriveSecret(options: { publicKey: any }): Promise<Uint8Array>
}

/**
 * Runtime HMAC contract used to blind indexable attributes (for example, in an
 * EDV). Sits alongside the `ISigner` / `IVerifier` runtime contracts.
 */
export interface IHMAC {
  id?: string
  algorithm?: string
  sign(options: { data: Uint8Array }): Promise<Uint8Array>
  verify(options: { data: Uint8Array; signature: Uint8Array }): Promise<boolean>
}
