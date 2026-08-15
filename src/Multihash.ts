/*!
 * A pure multihash byte codec, per the multiformats multihash spec
 * (https://github.com/multiformats/multihash): a varint-prefixed algorithm
 * identifier, a varint-prefixed digest length, and the raw digest bytes.
 *
 * This module has no hashing dependency of its own -- callers compute the
 * digest (SHA-256, SHA-384, SHA3-256, SHA3-384, ...) with whatever runtime
 * primitive they already have and pass the resulting bytes in. It only
 * encodes and decodes the multihash byte layout.
 */

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
 * @returns {{ algorithm: MultihashAlgorithm, digestLength: number, digest: Uint8Array }}
 */
export function decodeMultihash(bytes: Uint8Array): {
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
