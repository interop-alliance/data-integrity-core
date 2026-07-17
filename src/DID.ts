/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 */
import type { ILDContext, ILDType } from './LD.js'
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
 * An object type that permits arbitrary additional properties beyond the
 * ones it declares.
 *
 * Spec-conformant data (resolution metadata, document metadata, etc.) allows
 * unregistered extension properties; reads of undeclared properties come back
 * as `unknown` and must be narrowed before use.
 *
 * For *typed* extension properties, prefer TypeScript module augmentation
 * over reaching through the index signature, e.g. in a DID method package:
 *
 * ```ts
 * declare module '@interop/data-integrity-core' {
 *   interface IDIDDocumentMetadata {
 *     versionTime?: string
 *   }
 * }
 * ```
 */
export type Extensible = Record<string, unknown>

/**
 * Machine-readable problem details for a resolution failure, following the
 * RFC 9457 "Problem Details" shape. `type` is a URI identifying the error
 * class (e.g. an entry in a DID method's resolution-error registry), `title`
 * a short human-readable summary, and `detail` the occurrence-specific
 * explanation.
 *
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
export interface IProblemDetails {
  type: string
  title: string
  detail: string
}

/**
 * Error codes registered by the DID Resolution spec for
 * `didResolutionMetadata.error`. The `(string & {})` tail admits
 * method-specific codes while preserving autocomplete for the registered
 * ones.
 *
 * @see https://www.w3.org/TR/did-resolution/#errors
 */
export type IDIDResolutionErrorCode =
  | 'invalidDid'
  | 'invalidDidUrl'
  | 'invalidOptions'
  | 'methodNotSupported'
  | 'notFound'
  | 'representationNotSupported'
  | 'internalError'
  | (string & {})

/**
 * Metadata about the resolution process itself (content type, errors),
 * returned as the `didResolutionMetadata` property of a resolution result.
 *
 * @see https://www.w3.org/TR/did-core/#did-resolution-metadata
 */
export interface IDIDResolutionMetadata extends Extensible {
  contentType?: string
  error?: IDIDResolutionErrorCode
  problemDetails?: IProblemDetails
}

/**
 * Metadata about the resolved DID document (timestamps, versioning,
 * deactivation status), returned as the `didDocumentMetadata` property of a
 * resolution result.
 *
 * @see https://www.w3.org/TR/did-core/#did-document-metadata
 */
export interface IDIDDocumentMetadata extends Extensible {
  created?: string // dateTimeStamp
  updated?: string // dateTimeStamp
  deactivated?: boolean
  versionId?: string
  nextUpdate?: string // dateTimeStamp
  nextVersionId?: string
  equivalentId?: string | string[]
  canonicalId?: string
}

/**
 * Options passed to a DID resolution operation. `accept` is the only
 * spec-registered property (the preferred media type of the resolved
 * representation, e.g. `application/did+ld+json`); DID methods may define
 * additional options.
 *
 * @see https://www.w3.org/TR/did-core/#did-resolution-options
 */
export interface IDIDResolutionOptions extends Extensible {
  accept?: string
}

/**
 * The result of a DID resolution operation. On failure, `didDocument` is
 * `null` and the reason is in `didResolutionMetadata.error`.
 *
 * @see https://www.w3.org/TR/did-core/#did-resolution
 */
export interface IDIDResolutionResult {
  '@context'?: ILDContext
  didResolutionMetadata: IDIDResolutionMetadata
  didDocument: IDIDDocument | null
  didDocumentMetadata: IDIDDocumentMetadata
}

/**
 * A DID resolution failure carrying the spec error vocabulary, usable on
 * either error channel: throw it from APIs with exception-based contracts
 * (e.g. a did-io driver's `get()`), or call `toResolutionResult()` to render
 * the same failure as a spec resolution-result envelope
 * (`didResolutionMetadata.error` + `problemDetails`).
 */
export class DIDResolutionError extends Error {
  code: IDIDResolutionErrorCode
  problemDetails?: IProblemDetails

  constructor (
    message: string,
    { code, problemDetails, cause }: {
      code: IDIDResolutionErrorCode
      problemDetails?: IProblemDetails
      cause?: unknown
    }
  ) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'DIDResolutionError'
    this.code = code
    this.problemDetails = problemDetails
  }

  toResolutionResult (): IDIDResolutionResult {
    const didResolutionMetadata: IDIDResolutionMetadata = { error: this.code }
    if (this.problemDetails !== undefined) {
      didResolutionMetadata.problemDetails = this.problemDetails
    }
    return {
      didResolutionMetadata,
      didDocument: null,
      didDocumentMetadata: {}
    }
  }
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
