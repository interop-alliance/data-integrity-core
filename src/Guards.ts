/*!
 * Shape-detection guards and loose-shape normalizers for VC / DID / wallet
 * objects.
 *
 * The Universal Wallet data model has no discriminant field distinguishing its
 * content types, and incoming request payloads may be a bare Verifiable
 * Credential, a Verifiable Presentation, or unrelated JSON. These guards
 * identify each by object shape.
 *
 * Two distinct "is this a VC" checks live here on purpose:
 *
 *  - `isVerifiableCredential` / `isVerifiablePresentation` inspect the `type`
 *    field. VC-vs-VP routing REQUIRES this: a VP carries the same
 *    `credentials/v(1|2)` context as the VCs it wraps, so a context check cannot
 *    tell them apart.
 *  - `isCredential` inspects `@context`. It runs only over already-decrypted
 *    wallet contents (a mix of VC / DID document / key / profile metadata),
 *    where the context cleanly separates a VC from the non-credential entries.
 *
 * The `typeArray` / `issuerId` / `subjectId` normalizers read the loosely-typed
 * `type`, `issuer`, and `credentialSubject.id` fields, each of which the VC data
 * model allows in more than one form.
 */
import type {
  ICredentialSubject,
  IVerifiableCredential,
  IVerifiablePresentation
} from './VCDM.js'
import type { IDidDocument } from './DID.js'
import type { IKeyPair } from './KeyPair.js'

/**
 * Reads the `type` field of an arbitrary value in the same permissive way the
 * VC data model allows it (a string or an array of strings), returning whether
 * it contains `value`. A string `type` is matched with `String.includes`
 * (substring), an array with membership; any other shape yields `false`.
 */
function typeContains(value: unknown, needle: string): boolean {
  const type = (value as { type?: unknown } | null | undefined)?.type
  if (typeof type === 'string') {
    return type.includes(needle)
  }
  if (Array.isArray(type)) {
    return type.includes(needle)
  }
  return false
}

/**
 * Reads the `@context` field of an arbitrary value (a string or an array),
 * returning whether it contains `value`.
 */
function contextContains(item: unknown, needle: string): boolean {
  const context = (item as { '@context'?: unknown } | null | undefined)?.[
    '@context'
  ]
  if (typeof context === 'string') {
    return context.includes(needle)
  }
  if (Array.isArray(context)) {
    return context.includes(needle)
  }
  return false
}

/**
 * Whether an object is a Verifiable Credential, by inspecting its `type` for
 * `'VerifiableCredential'`.
 */
export function isVerifiableCredential(
  obj: unknown
): obj is IVerifiableCredential {
  return typeContains(obj, 'VerifiableCredential')
}

/**
 * Whether an object is a Verifiable Presentation, by inspecting its `type` for
 * `'VerifiablePresentation'`.
 */
export function isVerifiablePresentation(
  obj: unknown
): obj is IVerifiablePresentation {
  return typeContains(obj, 'VerifiablePresentation')
}

/**
 * Whether a decrypted wallet content item is a Verifiable Credential, by
 * inspecting its `@context` for a VC Data Model v1 or v2 context URL.
 */
export function isCredential(item: unknown): item is IVerifiableCredential {
  return (
    contextContains(item, 'https://www.w3.org/2018/credentials/v1') ||
    contextContains(item, 'https://www.w3.org/ns/credentials/v2')
  )
}

/**
 * Whether a decrypted wallet content item is a DID Document, by inspecting its
 * `@context` for the DID v1 context URL.
 */
export function isDidDocument(item: unknown): item is IDidDocument {
  return contextContains(item, 'https://www.w3.org/ns/did/v1')
}

/**
 * Whether a decrypted wallet content item is an Ed25519 verification key.
 */
export function isVerificationKey(item: unknown): item is IKeyPair {
  return (
    (item as { type?: unknown } | null | undefined)?.type ===
    'Ed25519VerificationKey2020'
  )
}

/**
 * Normalizes a `type` value (string or array) to an array of strings.
 *
 * @param type {unknown}
 * @returns {string[]}
 */
export function typeArray(type: unknown): string[] {
  if (typeof type === 'string') {
    return [type]
  }
  return Array.isArray(type)
    ? type.filter((entry): entry is string => typeof entry === 'string')
    : []
}

/**
 * Extracts a DID / id string from an issuer value that may be a string or an
 * `{ id }` object.
 *
 * @param issuer {unknown}
 * @returns {string | undefined}
 */
export function issuerId(issuer: unknown): string | undefined {
  if (typeof issuer === 'string') {
    return issuer
  }
  if (issuer && typeof issuer === 'object' && 'id' in issuer) {
    const { id } = issuer as { id?: unknown }
    return typeof id === 'string' ? id : undefined
  }
  return undefined
}

/**
 * The credentialSubject id of a VC, when present.
 *
 * @param credential {IVerifiableCredential}
 * @returns {string | undefined}
 */
export function subjectId(
  credential: IVerifiableCredential
): string | undefined {
  const subject = credential.credentialSubject as
    | ICredentialSubject
    | { id?: unknown }
    | undefined
  return subject && typeof subject.id === 'string' ? subject.id : undefined
}
