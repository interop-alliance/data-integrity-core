/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 */
import type { IJWE } from './Cipher.js'

/**
 * The document and configuration model for Encrypted Data Vaults (EDVs), as
 * used by `@interop/edv-client` and EDV server implementations.
 *
 * @see https://digitalbazaar.github.io/encrypted-data-vaults/
 */

/**
 * A blinded indexable attribute (name/value pair) within an index entry. The
 * `name` and `value` are HMAC-blinded so the server can match on them without
 * learning the cleartext.
 */
export interface IIndexAttribute {
  name: string
  value?: string
  unique?: boolean
}

/**
 * A blinded index entry attached to an encrypted document. One entry exists per
 * HMAC used to blind the document's indexable attributes.
 */
export interface IIndexEntry {
  hmac: { id: string; type: string }
  sequence: number
  attributes: IIndexAttribute[]
}

/**
 * Stream metadata recorded on a document whose content has an associated
 * chunked data stream. `pending` marks a stream that has been declared but not
 * yet fully stored.
 */
export interface IEDVDocumentStream {
  sequence?: number
  chunks?: number
  pending?: boolean
}

/**
 * A decrypted (working) EDV document: cleartext `content` / `meta` plus the
 * envelope fields. `id` is assigned on first insert; `sequence` is managed by
 * the client.
 */
export interface IEDVDocument {
  id?: string
  sequence?: number
  content: Record<string, unknown>
  meta?: Record<string, unknown>
  stream?: IEDVDocumentStream
  indexed?: IIndexEntry[]
  jwe?: IJWE
}

/**
 * An encrypted EDV document as stored on, and returned by, an EDV server. The
 * cleartext `content` / `meta` are carried inside `jwe`.
 */
export interface IEncryptedDocument {
  id: string
  sequence: number
  jwe: IJWE
  indexed: IIndexEntry[]
  stream?: IEDVDocumentStream
}

/**
 * One encrypted chunk of a document's data stream. Carries its own JWE plus the
 * owning document's `sequence` and the chunk's ordinal `index`.
 */
export interface IEDVChunk {
  sequence: number
  index?: number
  jwe?: IJWE
  [key: string]: unknown
}

/**
 * An EDV configuration document.
 */
export interface IEDVConfig {
  id?: string
  controller: string
  sequence: number
  referenceId?: string
  keyAgreementKey?: { id: string; type: string }
  hmac?: { id: string; type: string }
}

/**
 * A query submitted to an EDV index service. Carries blinded `equals` / `has`
 * filters (only one of which may be set at a time) against the index named by
 * `index` (the HMAC id).
 */
export interface IEDVQuery {
  index: string
  equals?: Array<Record<string, string>>
  has?: string[]
  count?: boolean
  limit?: number
  returnDocuments?: boolean
}
