/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 */
import type { ILDType } from './LD.js'
import type { IPublicJWK } from './KeyPair.js'

/**
 * A Decentralized Identifier (DID) URL
 * @see https://www.w3.org/TR/did-core/#did-syntax
 */
export type IDID = `did:${string}`

export type IDIDDocument = IDIDDocument_v1_0 | IDIDDocument_v1_1

/**
 * @see https://www.w3.org/TR/cid-1.0/#referring-to-verification-methods
 */
export type IVerificationMethodReference = string

/**
 * @see https://www.w3.org/TR/cid-1.0/#verification-methods
 */
export interface IVerificationMethodCore {
  id: string // URL
  type: string
  controller: string | IDID // URL
  expires?: string // dateTimeStamp
  revoked?: string // dateTimeStamp
}

export interface IJSONWebKeyMethod extends IVerificationMethodCore {
  type: 'JsonWebKey',
  publicKeyJwk: IPublicJWK
}

export interface IMultikeyMethod extends IVerificationMethodCore {
  type: 'Multikey',
  publicKeyMultibase: string
}

export type IVerificationMethod = IJSONWebKeyMethod | IMultikeyMethod

/**
 * A value held by a verification relationship -- either a full embedded
 * verification method, or a URL reference to one defined elsewhere.
 *
 * @see https://www.w3.org/TR/cid-1.0/#referring-to-verification-methods
 */
export type IVerificationMethodEntry =
  | IVerificationMethod
  | IVerificationMethodReference

// @see https://www.w3.org/TR/cid-1.0/#services
export interface IServiceObject {
  id?: string // a URL
  type: ILDType
  serviceEndpoint: string | string[]
}

export interface IDIDCoreDocument {
  id: IDID

  controller?: IDID | IDID[]

  alsoKnownAs?: string | string[]

  service?: IServiceObject | IServiceObject[]

  /**
   * Verification Relationships
   * @see https://www.w3.org/TR/cid-1.0/#verification-relationships
   */
  // Verification method used for signing assertions such as VCs
  assertionMethod?: IVerificationMethodEntry | IVerificationMethodEntry[]

  // Verification method used for authentication
  //   and (for some DID methods) for key rotation and document updates
  authentication?: IVerificationMethodEntry | IVerificationMethodEntry[]

  // Used for delegating zCaps (Authorization Capabilities) chains
  capabilityDelegation?: IVerificationMethodEntry | IVerificationMethodEntry[]

  // Used for invoking zCaps (Authorization Capabilities) chains
  capabilityInvocation?: IVerificationMethodEntry | IVerificationMethodEntry[]

  // Used for encrypting/decrypting
  keyAgreement?: IVerificationMethodEntry | IVerificationMethodEntry[]

  // Used when the verification purpose (auth, assertion, etc) is unknown,
  // or when a key can be used for all purposes
  verificationMethod?: IVerificationMethodEntry | IVerificationMethodEntry[]
}

/**
 * @see https://www.w3.org/TR/did-1.0/
 */
export interface IDIDDocument_v1_0 extends IDIDCoreDocument {
  '@context': ['https://www.w3.org/ns/did/v1', ...Array<string | object>]
}

/**
 * @see https://www.w3.org/TR/did-1.1/
 */
export interface IDIDDocument_v1_1 extends IDIDCoreDocument {
  '@context': ['https://www.w3.org/ns/did/v1.1', ...Array<string | object>]
}

/**
 * @deprecated Renamed to IDIDDocument.
 */
export type IDidDocument = IDIDDocument

/**
 * @deprecated Renamed to IDIDCoreDocument.
 */
export type IDidCoreDocument = IDIDCoreDocument

/**
 * @deprecated Renamed to IDIDDocument_v1_0.
 */
export type IDidDocument_v1_0 = IDIDDocument_v1_0

/**
 * @deprecated Renamed to IDIDDocument_v1_1.
 */
export type IDidDocument_v1_1 = IDIDDocument_v1_1

/**
 * @deprecated Renamed to IJSONWebKeyMethod.
 */
export type IJsonWebKeyMethod = IJSONWebKeyMethod
