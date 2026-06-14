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
  kid: string
  alg: string
  epk?: IEPK
  apu?: string
  apv?: string
  [key: string]: unknown
}

/**
 * A JWE recipient template -- the pre-encryption input describing who a JWE
 * should be encrypted to. The key-agreement `header` (`kid`/`alg`) is known up
 * front; the `epk`/`apu`/`apv` and `encrypted_key` are filled in during
 * encryption, producing a complete `IRecipient`.
 */
export interface IRecipientTemplate {
  header: IRecipientHeader
}

/**
 * A JWE recipient, as it appears in a serialized JWE. Carries the wrapped
 * content-encryption key (`encrypted_key`) alongside its key-agreement header.
 */
export interface IRecipient extends IRecipientTemplate {
  encrypted_key: string
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

/**
 * Serialized form of a `SHA256HMACKey` -- a key reference (`id`, `type`)
 * plus, when exported with secret material, the symmetric secret as a JWK
 * (`kty: 'oct'`). The reference form (no `secretKeyJwk`) is what an EDV config
 * stores; the full form is what a wallet persists to reconstruct the key.
 *
 * `type` is the protocol value `'Sha256HmacKey2019'` (as written into EDV index
 * entries and configs); only the TypeScript identifier drops the year.
 */
export interface ISHA256HMACKey {
  id: string
  type: 'Sha256HmacKey2019'
  secretKeyJwk?: JsonWebKey
}

/**
 * A SHA-256 HMAC key (`Sha256HmacKey2019`) -- the reference, KMS-free
 * implementation of the {@link IHMAC} contract used to blind EDV indexable
 * attributes. Backed by the global WebCrypto subtle API (isomorphic; no
 * dependencies). The historical upstream role is filled by a KMS-backed key
 * (e.g. `@digitalbazaar/webkms-client`); this is the local stand-in that every
 * EDV consumer otherwise hand-rolls.
 *
 * Serializes via JWK (`crypto.subtle.exportKey('jwk', ...)`), so the secret is
 * carried as a standard `kty: 'oct'` JWK -- no custom base encoding and no
 * extra dependency. The serialized `type` is the protocol string
 * `'Sha256HmacKey2019'`.
 */
export class SHA256HMACKey implements IHMAC {
  id: string
  readonly type = 'Sha256HmacKey2019'
  readonly algorithm = 'HS256'
  /** The underlying WebCrypto HMAC-SHA-256 key. */
  key: CryptoKey

  /**
   * @param options {object}
   * @param options.id {string}
   * @param options.key {CryptoKey}
   */
  constructor({ id, key }: { id: string; key: CryptoKey }) {
    this.id = id
    this.key = key
  }

  /**
   * Generate a new HMAC key with fresh random secret material.
   *
   * @param [options] {object}
   * @param [options.id] {string}   Key id; a random `urn:uuid:` when omitted.
   * @returns {Promise<SHA256HMACKey>}
   */
  static async generate({ id }: { id?: string } = {}): Promise<SHA256HMACKey> {
    const key = (await crypto.subtle.generateKey(
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign', 'verify']
    )) as CryptoKey
    return new SHA256HMACKey({ id: id ?? `urn:uuid:${crypto.randomUUID()}`, key })
  }

  /**
   * Reconstruct an HMAC key from its serialized form (a JWK secret).
   *
   * @param document {ISHA256HMACKey}
   * @returns {Promise<SHA256HMACKey>}
   */
  static async from(document: ISHA256HMACKey): Promise<SHA256HMACKey> {
    const { id, secretKeyJwk } = document
    if (!secretKeyJwk) {
      throw new Error('Cannot import a SHA256HMACKey without "secretKeyJwk".')
    }
    const key = await crypto.subtle.importKey(
      'jwk',
      secretKeyJwk,
      { name: 'HMAC', hash: 'SHA-256' },
      true,
      ['sign', 'verify']
    )
    return new SHA256HMACKey({ id, key })
  }

  /**
   * Serialize the key: the `id`/`type` reference, plus the secret as a JWK when
   * `secretKey` is requested.
   *
   * @param [options] {object}
   * @param [options.secretKey] {boolean}   Include the secret JWK.
   * @returns {Promise<ISHA256HMACKey>}
   */
  async export({
    secretKey = false
  }: { secretKey?: boolean } = {}): Promise<ISHA256HMACKey> {
    const document: ISHA256HMACKey = { id: this.id, type: this.type }
    if (secretKey) {
      document.secretKeyJwk = await crypto.subtle.exportKey('jwk', this.key)
    }
    return document
  }

  /**
   * Sign data, producing an HMAC-SHA-256 tag.
   *
   * @param options {object}
   * @param options.data {Uint8Array}
   * @returns {Promise<Uint8Array>}
   */
  async sign({ data }: { data: Uint8Array }): Promise<Uint8Array> {
    const signature = await crypto.subtle.sign(
      'HMAC',
      this.key,
      data as BufferSource
    )
    return new Uint8Array(signature)
  }

  /**
   * Verify an HMAC-SHA-256 tag against data.
   *
   * @param options {object}
   * @param options.data {Uint8Array}
   * @param options.signature {Uint8Array}
   * @returns {Promise<boolean>}
   */
  async verify({
    data,
    signature
  }: {
    data: Uint8Array
    signature: Uint8Array
  }): Promise<boolean> {
    return crypto.subtle.verify(
      'HMAC',
      this.key,
      signature as BufferSource,
      data as BufferSource
    )
  }
}
