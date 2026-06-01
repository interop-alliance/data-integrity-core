/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 */
import type { ILdType } from './LD.js'
import type { IPublicJwk } from './KeyPair.js'

/**
 * A Decentralized Identifier (DID) URL
 * @see https://www.w3.org/TR/did-core/#did-syntax
 */
export type IDID = `did:${string}`

export type IDidDocument = IDidDocument_v1_0 | IDidDocument_v1_1

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

export interface IJsonWebKeyMethod extends IVerificationMethodCore {
  type: 'JsonWebKey',
  publicKeyJwk: IPublicJwk
}

export interface IMultikeyMethod extends IVerificationMethodCore {
  type: 'Multikey',
  publicKeyMultibase: string
}

export type IVerificationMethod = IJsonWebKeyMethod | IMultikeyMethod

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
  type: ILdType
  serviceEndpoint: string | string[]
}

export interface IDidCoreDocument {
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
export interface IDidDocument_v1_0 extends IDidCoreDocument {
  '@context': ['https://www.w3.org/ns/did/v1', ...Array<string | object>]
}

/**
 * @see https://www.w3.org/TR/did-1.1/
 */
export interface IDidDocument_v1_1 extends IDidCoreDocument {
  '@context': ['https://www.w3.org/ns/did/v1.1', ...Array<string | object>]
}
