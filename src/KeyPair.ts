/*!
 * Copyright (c) 2026 Interop Alliance.
 */
export type IKeyPair =
  | IVerificationKeyPair2018
  | IVerificationKeyPair2020
  | IMultikeyPair
  | IJsonWebKeyPair

export type IPublicKey =
  | IPublicKey2018
  | IPublicKey2020
  | IPublicMultikey
  | IJsonWebPublicKey

export interface IKeyPairCore {
  '@context'?: string
  id?: string
  type?: string
  controller?: string
  revoked?: string
}

export interface IPublicKey2018 extends IKeyPairCore {
  // Used by Ed25519VerificationKey2018 and others
  publicKeyBase58?: string
}
export interface IVerificationKeyPair2018 extends IPublicKey2018 {
  // Used by Ed25519VerificationKey2018 and others
  privateKeyBase58?: string
}

export interface IPublicKey2020 extends IKeyPairCore {
  // Used by Ed25519VerificationKey2020 and X25519KeyAgreementKey2020
  publicKeyMultibase?: string
}

export interface IKeyAgreementKeyPair2020 extends IPublicKey2020 {
  // Used by X25519KeyAgreementKey2020
  privateKeyMultibase?: string
}

export interface IVerificationKeyPair2020 extends IPublicKey2020 {
  // Used by Ed25519VerificationKey2020
  privateKeyMultibase?: string
}

/**
 * @see https://www.w3.org/TR/cid-1.0/#Multikey
 */
export interface IPublicMultikey extends IKeyPairCore {
  publicKeyMultibase: string
}
export interface IMultikeyPair extends IPublicMultikey {
  secretKeyMultibase: string
}

/**
 * JWK key types, modeled as discriminated unions over `kty` (and `crv` where
 * applicable). Public variants forbid the private scalar `d` via `d?: never`,
 * so a secret JWK is not assignable to a public JWK at the type level.
 *
 * Add new key types (e.g. post-quantum ML-DSA `kty: 'AKP'`) by appending a
 * public/secret pair to the unions below.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7517
 * @see https://datatracker.ietf.org/doc/html/rfc7518
 */

/**
 * EC keys: P-256, P-384, P-521, secp256k1.
 */
export interface IEcJwkCore {
  kty: 'EC'
  crv: 'P-256' | 'P-384' | 'P-521' | 'secp256k1'
  // Public coordinates, base64url-encoded
  x: string
  y: string
  alg?: string
  kid?: string
  use?: 'sig' | 'enc'
}
export interface IEcPublicJwk extends IEcJwkCore {
  d?: never
}
export interface IEcSecretJwk extends IEcJwkCore {
  // Private scalar, base64url-encoded
  d: string
}

/**
 * OKP keys: Ed25519, Ed448 (signing); X25519, X448 (key agreement).
 */
export interface IOkpJwkCore {
  kty: 'OKP'
  crv: 'Ed25519' | 'Ed448' | 'X25519' | 'X448'
  // Public key, base64url-encoded
  x: string
  alg?: string
  kid?: string
  use?: 'sig' | 'enc'
}
export interface IOkpPublicJwk extends IOkpJwkCore {
  d?: never
}
export interface IOkpSecretJwk extends IOkpJwkCore {
  // Private key, base64url-encoded
  d: string
}

/**
 * RSA keys. CRT parameters (p, q, dp, dq, qi) are RECOMMENDED but optional
 * per RFC 7518; only `d` is required for a private RSA JWK.
 */
export interface IRsaJwkCore {
  kty: 'RSA'
  // Modulus and public exponent, base64url-encoded
  n: string
  e: string
  alg?: string
  kid?: string
  use?: 'sig' | 'enc'
}
export interface IRsaPublicJwk extends IRsaJwkCore {
  d?: never
  p?: never
  q?: never
  dp?: never
  dq?: never
  qi?: never
}
export interface IRsaSecretJwk extends IRsaJwkCore {
  d: string
  p?: string
  q?: string
  dp?: string
  dq?: string
  qi?: string
}

export type IPublicJwk = IEcPublicJwk | IOkpPublicJwk | IRsaPublicJwk
export type ISecretJwk = IEcSecretJwk | IOkpSecretJwk | IRsaSecretJwk

/**
 * JWK-backed verification material -- contains public key material only.
 *
 * @see https://www.w3.org/TR/cid-1.0/#JsonWebKey
 */
export interface IJsonWebPublicKey extends IKeyPairCore {
  publicKeyJwk: IPublicJwk
}

/**
 * JWK-backed key pair -- serialization form holding both halves. Project to
 * `IJsonWebPublicKey` before publishing in a DID or CID document.
 */
export interface IJsonWebKeyPair extends IJsonWebPublicKey {
  secretKeyJwk: ISecretJwk
}

export interface ISignablePayload {
  data: Uint8Array
}
export interface ISigner {
  // Contains the key id
  id: string
  // Used by DataIntegrity signature suites. For example, 'Ed25519'
  algorithm?: string
  sign: (signable: ISignablePayload) => Promise<Uint8Array>
}

export interface IVerifiablePayload {
  data: Uint8Array
  signature: Uint8Array
}
export interface IVerifier {
  id?: string
  algorithm?: string
  verify: (data: IVerifiablePayload) => Promise<boolean>
}
