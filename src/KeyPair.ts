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
  '@context'?: string | string[]
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
 * Multikey verification-method document -- either public-only
 * (`IPublicMultikey`) or with secret material (`IMultikeyPair`). The union is
 * the natural input type for importers: a `'secretKeyMultibase' in document`
 * check narrows it to `IMultikeyPair`. Both arms guarantee `publicKeyMultibase`
 * per the Multikey spec.
 * Used in various keys' from() factory methods.
 */
export type IMultikeyDocument = IPublicMultikey | IMultikeyPair

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

/**
 * JsonWebKey verification-method document -- either public-only
 * (`IJsonWebPublicKey`) or with secret material (`IJsonWebKeyPair`). The union
 * is the natural input type for importers: a `'secretKeyJwk' in document` check
 * narrows it to `IJsonWebKeyPair`. Both arms guarantee `publicKeyJwk`.
 * Used in various keys' from() factory methods.
 */
export type IJsonWebKeyDocument = IJsonWebPublicKey | IJsonWebKeyPair

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

export interface IVerificationResult {
  verified: boolean
  error?: Error
}

export interface GenerateKeyPairOptions extends IKeyPairCore {
  seed?: Uint8Array
}

/**
 * Abstract base class for "live" key pair instances -- the runtime half of the
 * IKeyPair contract defined above. Subclasses (e.g. Ed25519VerificationKey)
 * supply key material and the suite-specific signer()/verifier() methods.
 * Adapted from `@digitalcredentials/keypair`
 */
export abstract class AbstractKeyPair implements IKeyPairCore {
  public id?: string
  public type?: string
  public controller?: string
  public revoked?: string

  // Implementers must override this in subclasses
  static SUITE_CONTEXT: string = 'INVALID KeyPair CONTEXT'

  /**
   * Creates a public/private key pair instance. This is an abstract base class,
   * actual key material and suite-specific methods are handled in the subclass.
   *
   * @param options {object} - The options to use.
   * @param options.id {string} - The key id, typically composed of controller
   *   URL and key fingerprint as hash fragment.
   * @param options.controller {string} - DID/URL of the person/entity
   *   controlling this key.
   * @param [options.revoked] {string} - Timestamp of when the key has been
   *   revoked, in RFC3339 format. If not present, the key itself is
   *   considered not revoked.
   */
  constructor({ id, controller, revoked }: IKeyPairCore = {}) {
    this.id = id
    this.type = '' // type must be set by subclasses
    this.controller = controller
    this.revoked = revoked
  }

  /**
   * Generates a new public/private key pair instance.
   *
   * @param _options {GenerateKeyPairOptions} - Suite-specific options for the KeyPair --
   *   typically the IKeyPairCore metadata (id, controller, etc.) plus any
   *   subclass-specific generation inputs (e.g. a deterministic `seed`).
   *
   * @returns {Promise<AbstractKeyPair>} A KeyPair instance.
   */
  static async generate(
    _options: GenerateKeyPairOptions = {}
  ): Promise<AbstractKeyPair> {
    throw new Error('Abstract method, must be implemented in subclass.')
  }

  /**
   * Imports a key pair instance from a provided externally fetched key
   * document, optionally checking it for revocation and required context.
   *
   * @param options {object} - Options hashmap.
   * @param options.document {IKeyPairCore} - Externally fetched key document.
   * @param [options.checkContext] {boolean} - Whether to check that the
   *   fetched key document contains the context required by the key's crypto
   *   suite.
   * @param [options.checkRevoked] {boolean} - Whether to check the key
   *   object for the presence of the `revoked` timestamp.
   *
   * @returns {Promise<AbstractKeyPair>} Resolves with the resulting key pair instance.
   */
  static async fromKeyDocument({
    document,
    checkContext = true,
    checkRevoked = true
  }: {
    document: IKeyPairCore
    checkContext?: boolean
    checkRevoked?: boolean
  }): Promise<AbstractKeyPair> {
    if (checkContext) {
      const fetchedDocContexts: string[] = Array.isArray(document['@context'])
        ? document['@context']
        : [document['@context'] as string]

      if (!fetchedDocContexts.includes(this.SUITE_CONTEXT)) {
        throw new Error(
          'Key document does not contain required context "' +
            this.SUITE_CONTEXT +
            '".'
        )
      }
    }
    if (checkRevoked && (document.revoked ?? '') !== '') {
      throw new Error(`Key has been revoked since: "${document.revoked ?? ''}".`)
    }
    return await this.from(document)
  }

  /**
   * Generates a KeyPair from some options.
   *
   * @param _options {IKeyPairCore} - Key pair description object.
   *
   * @returns {Promise<AbstractKeyPair>} A KeyPair.
   * @throws Unsupported Key Type.
   */
  static async from(_options: IKeyPairCore): Promise<AbstractKeyPair> {
    throw new Error('Abstract method from() must be implemented in subclass.')
  }

  /**
   * Exports the serialized representation of the KeyPair and other information
   * that json-ld Signatures can use to form a proof.
   *
   * NOTE: Subclasses MUST override this method (and add the exporting of
   * their public and private key material).
   *
   * @param [options] {object} - Options hashmap.
   * @param [options.publicKey] {boolean} - Export public key material?
   * @param [options.secretKey] {boolean} - Export secret key material?
   * @param [options.includeContext] {boolean} - Include the suite context?
   *
   * @returns {IKeyPair} A public key object.
   */
  export({
    publicKey = false,
    secretKey = false
  }: {
    publicKey?: boolean
    secretKey?: boolean
    includeContext?: boolean
  } = {}): IKeyPair {
    if (!publicKey && !secretKey) {
      throw new Error(
        'Export requires specifying either "publicKey" or "secretKey".'
      )
    }
    const key: IKeyPair = {
      id: this.id,
      type: this.type,
      controller: this.controller
    }
    if (this.revoked != null) {
      key.revoked = this.revoked
    }

    return key
  }

  /**
   * Returns the public key fingerprint, multibase+multicodec encoded.
   *
   * @returns {string} The fingerprint.
   */
  abstract fingerprint(): string

  /**
   * Verifies that a given key fingerprint matches the public key material
   * belonging to this key pair.
   *
   * @param options {object} - Options hashmap.
   * @param options.fingerprint {string} - Public key fingerprint.
   *
   * @returns {IVerificationResult} An object with verified flag.
   */
  abstract verifyFingerprint({
    fingerprint
  }: {
    fingerprint: string
  }): IVerificationResult

  /**
   * Returns a signer object. NOTE: Applies only to verifier type keys.
   *
   * @returns {ISigner} A signer for json-ld usage.
   */
  abstract signer(): ISigner

  /**
   * Returns a verifier object. NOTE: Applies only to verifier type keys.
   *
   * @returns {IVerifier} Used to verify jsonld-signatures.
   */
  abstract verifier(): IVerifier
}
