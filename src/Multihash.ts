/*!
 * A pure multihash byte codec, per the multiformats multihash spec
 * (https://github.com/multiformats/multihash): a varint-prefixed algorithm
 * identifier, a varint-prefixed digest length, and the raw digest bytes.
 * Alongside it, a multikey decoder for the sibling multiformats layout --
 * a varint-prefixed multicodec key type followed by the raw public key
 * bytes -- carried as a base58btc multibase string.
 *
 * This module has no hashing dependency of its own -- callers compute the
 * digest (SHA-256, SHA-384, SHA3-256, SHA3-384, ...) with whatever runtime
 * primitive they already have and pass the resulting bytes in. It only
 * encodes and decodes the multihash byte layout. It stays hashing-free with
 * the multikey decoder too: base58 is a pure codec, not a hash.
 */
import { base58 } from '@scure/base'

/**
 * Supported Multihash algorithm identifiers.
 */
export enum MultihashAlgorithm {
  SHA2_256 = 0x12,
  SHA2_384 = 0x20,
  SHA3_256 = 0x16,
  SHA3_384 = 0x15
}

/**
 * Supported multikey (multicodec public key) identifiers.
 */
export enum MultikeyCodec {
  ED25519_PUB = 0xed,
  X25519_PUB = 0xec
}

/**
 * Expected raw public key lengths for each multikey codec (in bytes).
 */
const KEY_LENGTHS: Record<MultikeyCodec, number> = {
  [MultikeyCodec.ED25519_PUB]: 32,
  [MultikeyCodec.X25519_PUB]: 32
}

/**
 * Expected digest lengths for each algorithm (in bytes).
 */
const DIGEST_LENGTHS: Record<MultihashAlgorithm, number> = {
  [MultihashAlgorithm.SHA2_256]: 32,
  [MultihashAlgorithm.SHA2_384]: 48,
  [MultihashAlgorithm.SHA3_256]: 32,
  [MultihashAlgorithm.SHA3_384]: 48
}

/**
 * Encodes a varint (variable integer).
 *
 * @param value {number}
 * @returns {Uint8Array}
 */
function encodeVarint(value: number): Uint8Array {
  const bytes: number[] = []

  while (value >= 0x80) {
    bytes.push((value & 0x7f) | 0x80)
    value >>>= 7
  }

  bytes.push(value & 0x7f)

  return new Uint8Array(bytes)
}

/**
 * Maximum varint size accepted when decoding. Two bytes covers every
 * supported algorithm code and digest length; a longer varint is either
 * an overlong encoding or a value outside the multihash profile, and
 * unbounded decoding would overflow 32-bit bitwise arithmetic.
 */
const MAX_VARINT_BYTES = 2

/**
 * Decodes a varint (variable integer), rejecting overlong (non-canonical)
 * encodings so each value has exactly one byte representation.
 *
 * @param bytes {Uint8Array} The bytes containing the varint.
 * @param [offset] {number} The starting offset in the bytes array.
 * @returns {{ value: number, bytesRead: number }}
 */
function decodeVarint(
  bytes: Uint8Array,
  offset = 0
): { value: number; bytesRead: number } {
  let value = 0
  let shift = 0
  let bytesRead = 0
  let byte: number

  do {
    if (bytesRead >= MAX_VARINT_BYTES) {
      throw new Error(`Invalid varint: longer than ${MAX_VARINT_BYTES} bytes`)
    }
    if (offset + bytesRead >= bytes.length) {
      throw new Error('Invalid varint: buffer too short')
    }

    byte = bytes[offset + bytesRead] as number
    value |= (byte & 0x7f) << shift
    shift += 7
    bytesRead++
  } while (byte & 0x80)

  // A multi-byte varint whose final group is zero encodes a value that
  // fits in fewer bytes, e.g. [0x92, 0x00] for 0x12
  if (bytesRead > 1 && (byte & 0x7f) === 0) {
    throw new Error('Invalid varint: overlong encoding')
  }

  return { value, bytesRead }
}

/**
 * Creates a multihash from an already-computed digest and its algorithm.
 *
 * @param digest {Uint8Array} The digest bytes.
 * @param algorithm {MultihashAlgorithm} The hash algorithm used.
 * @returns {Uint8Array} The multihash.
 */
export function createMultihash(
  digest: Uint8Array,
  algorithm: MultihashAlgorithm
): Uint8Array {
  const expectedLength = DIGEST_LENGTHS[algorithm]
  if (expectedLength === undefined) {
    throw new Error(
      `Unsupported multihash algorithm: 0x${algorithm.toString(16)}`
    )
  }
  if (digest.length !== expectedLength) {
    throw new Error(
      `Invalid digest length for algorithm 0x${algorithm.toString(16)}: expected ${expectedLength}, got ${digest.length}`
    )
  }

  const algorithmBytes = encodeVarint(algorithm)
  const lengthBytes = encodeVarint(digest.length)

  const result = new Uint8Array(
    algorithmBytes.length + lengthBytes.length + digest.length
  )
  result.set(algorithmBytes, 0)
  result.set(lengthBytes, algorithmBytes.length)
  result.set(digest, algorithmBytes.length + lengthBytes.length)

  return result
}

/**
 * Decodes a multihash, validating its algorithm and digest length.
 *
 * @param bytes {Uint8Array} The multihash bytes.
 * @param [expectedAlgorithm] {MultihashAlgorithm} When supplied, the decoded
 *   algorithm must match it, so a caller that only accepts one algorithm does
 *   not have to compare after the fact.
 * @returns {{ algorithm: MultihashAlgorithm, digestLength: number, digest: Uint8Array }}
 */
export function decodeMultihash(
  bytes: Uint8Array,
  expectedAlgorithm?: MultihashAlgorithm
): {
  algorithm: MultihashAlgorithm
  digestLength: number
  digest: Uint8Array
} {
  if (bytes.length < 2) {
    throw new Error('Invalid multihash: too short')
  }

  // Decode the algorithm identifier
  const { value: algorithm, bytesRead: algorithmBytesRead } = decodeVarint(
    bytes,
    0
  )

  // Verify the algorithm is supported before touching the rest of the input
  const expectedLength = DIGEST_LENGTHS[algorithm as MultihashAlgorithm]
  if (expectedLength === undefined) {
    throw new Error(
      `Unsupported multihash algorithm: 0x${algorithm.toString(16)}`
    )
  }

  // Reject an algorithm the caller does not accept before the rest of the input
  if (expectedAlgorithm !== undefined && algorithm !== expectedAlgorithm) {
    throw new Error(
      `Unexpected multihash algorithm: expected 0x${expectedAlgorithm.toString(16)}, got 0x${algorithm.toString(16)}`
    )
  }

  // Decode the digest length
  const { value: digestLength, bytesRead: lengthBytesRead } = decodeVarint(
    bytes,
    algorithmBytesRead
  )

  // Verify the digest length matches the expected length for the algorithm
  if (digestLength !== expectedLength) {
    throw new Error(
      `Invalid digest length for algorithm 0x${algorithm.toString(16)}: expected ${expectedLength}, got ${digestLength}`
    )
  }

  // Extract the digest, requiring an exact-length buffer so each logical
  // multihash has exactly one byte representation
  const offset = algorithmBytesRead + lengthBytesRead
  if (bytes.length - offset < digestLength) {
    throw new Error(
      `Invalid multihash: digest too short, expected ${digestLength} bytes`
    )
  }
  if (bytes.length - offset > digestLength) {
    throw new Error('Invalid multihash: unexpected trailing bytes')
  }

  const digest = bytes.slice(offset, offset + digestLength)

  return {
    algorithm: algorithm as MultihashAlgorithm,
    digestLength,
    digest
  }
}

/**
 * Decodes a multikey -- a multicodec-prefixed public key, per the multiformats
 * multicodec table (https://github.com/multiformats/multicodec) -- carried as
 * a base58btc multibase string (the `z` prefix). The leading varint names the
 * key type and the remaining bytes are the raw public key.
 *
 * The expectation parameter sits on the codec here and on the algorithm in
 * `decodeMultihash`, because the two layouts carry different identifiers: a
 * multihash has no multikey codec, and a multikey has no digest algorithm.
 *
 * Decoding stays hashing-free; base58 is a pure codec.
 *
 * @param options {object}
 * @param options.multikey {string} The `z`-prefixed base58btc multikey.
 * @param [options.expectedCodec] {MultikeyCodec} When supplied, the decoded
 *   codec must match it.
 * @returns {{ codec: MultikeyCodec, keyBytes: Uint8Array }} The decoded codec
 *   and the raw public key bytes, without the multicodec prefix.
 */
export function decodeMultikey({
  multikey,
  expectedCodec
}: {
  multikey: string
  expectedCodec?: MultikeyCodec
}): { codec: MultikeyCodec; keyBytes: Uint8Array } {
  if (!multikey.startsWith('z')) {
    throw new Error('Invalid multikey: expected a base58btc "z" prefix')
  }

  let bytes: Uint8Array
  try {
    bytes = base58.decode(multikey.slice(1))
  } catch (err) {
    throw new Error('Invalid multikey: malformed base58btc payload', {
      cause: err
    })
  }

  // Decode the multicodec identifier
  const { value: codec, bytesRead } = decodeVarint(bytes, 0)

  // Verify the codec is supported before touching the rest of the input
  const expectedLength = KEY_LENGTHS[codec as MultikeyCodec]
  if (expectedLength === undefined) {
    throw new Error(`Unsupported multikey codec: 0x${codec.toString(16)}`)
  }

  // Reject a codec the caller does not accept
  if (expectedCodec !== undefined && codec !== expectedCodec) {
    throw new Error(
      `Unexpected multikey codec: expected 0x${expectedCodec.toString(16)}, got 0x${codec.toString(16)}`
    )
  }

  // Require an exact-length key so each logical multikey has exactly one
  // byte representation
  const keyLength = bytes.length - bytesRead
  if (keyLength < expectedLength) {
    throw new Error(
      `Invalid key length for multikey codec 0x${codec.toString(16)}: expected ${expectedLength}, got ${keyLength}`
    )
  }
  if (keyLength > expectedLength) {
    throw new Error('Invalid multikey: unexpected trailing bytes')
  }

  return {
    codec: codec as MultikeyCodec,
    keyBytes: bytes.slice(bytesRead)
  }
}
