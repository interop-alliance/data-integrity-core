import { createHash } from 'node:crypto'
import { base58 } from '@scure/base'
import { describe, it, expect } from 'vitest'
import {
  createMultihash,
  decodeMultihash,
  decodeMultikey,
  MultihashAlgorithm,
  MultikeyCodec
} from '../../src/index.js'

function digestOf(algorithm: string, input: string): Uint8Array {
  return new Uint8Array(createHash(algorithm).update(input).digest())
}

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(
    hex.match(/../g)!.map((byte) => Number.parseInt(byte, 16))
  )
}

describe('multihash', () => {
  const sha256DigestBytes = digestOf('sha256', 'hello')

  it('round-trips a sha2-256 digest', () => {
    const multihash = createMultihash(
      sha256DigestBytes,
      MultihashAlgorithm.SHA2_256
    )
    expect(decodeMultihash(multihash)).toEqual({
      algorithm: MultihashAlgorithm.SHA2_256,
      digestLength: 32,
      digest: sha256DigestBytes
    })
  })

  // Known-answer vectors pin the exact byte layout; round-trip tests alone
  // would not catch a mirrored encode/decode bug. Digest values verified
  // against node:crypto; the Merkle-Damgard vector is the multihash spec's
  // own worked example (https://github.com/multiformats/multihash).
  const knownVectors: Array<{
    name: string
    nodeAlgorithm: string
    input: string
    algorithm: MultihashAlgorithm
    hex: string
  }> = [
    {
      name: 'sha2-256 spec example ("Merkle–Damgård")',
      nodeAlgorithm: 'sha256',
      input: 'Merkle–Damgård',
      algorithm: MultihashAlgorithm.SHA2_256,
      hex: '122041dd7b6443542e75701aa98a0c235951a28a0d851b11564d20022ab11d2589a8'
    },
    {
      name: 'sha2-256 ("hello")',
      nodeAlgorithm: 'sha256',
      input: 'hello',
      algorithm: MultihashAlgorithm.SHA2_256,
      hex: '12202cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
    },
    {
      name: 'sha2-384 ("hello")',
      nodeAlgorithm: 'sha384',
      input: 'hello',
      algorithm: MultihashAlgorithm.SHA2_384,
      hex: '203059e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f'
    },
    {
      name: 'sha3-256 ("hello")',
      nodeAlgorithm: 'sha3-256',
      input: 'hello',
      algorithm: MultihashAlgorithm.SHA3_256,
      hex: '16203338be694f50c5f338814986cdf0686453a888b84f424d792af4b9202398f392'
    },
    {
      name: 'sha3-384 ("hello")',
      nodeAlgorithm: 'sha3-384',
      input: 'hello',
      algorithm: MultihashAlgorithm.SHA3_384,
      hex: '1530720aea11019ef06440fbf05d87aa24680a2153df3907b23631e7177ce620fa1330ff07c0fddee54699a4c3ee0ee9d887'
    }
  ]

  for (const vector of knownVectors) {
    it(`matches the known vector for ${vector.name}`, () => {
      const digest = digestOf(vector.nodeAlgorithm, vector.input)
      const expectedBytes = hexToBytes(vector.hex)

      expect(createMultihash(digest, vector.algorithm)).toEqual(expectedBytes)
      expect(decodeMultihash(expectedBytes)).toEqual({
        algorithm: vector.algorithm,
        digestLength: digest.length,
        digest
      })
    })
  }

  it('decodes a multihash from a view with a non-zero byteOffset', () => {
    const multihash = createMultihash(
      sha256DigestBytes,
      MultihashAlgorithm.SHA2_256
    )
    const padded = new Uint8Array(multihash.length + 4)
    padded.set(multihash, 4)
    const view = padded.subarray(4)

    expect(decodeMultihash(view)).toEqual({
      algorithm: MultihashAlgorithm.SHA2_256,
      digestLength: 32,
      digest: sha256DigestBytes
    })
  })

  it('rejects creation with a digest of the wrong length', () => {
    expect(() =>
      createMultihash(new Uint8Array(16), MultihashAlgorithm.SHA2_256)
    ).toThrow('Invalid digest length for algorithm 0x12: expected 32, got 16')
  })

  it('rejects creation with an unsupported algorithm', () => {
    expect(() =>
      createMultihash(new Uint8Array(32), 0x99 as MultihashAlgorithm)
    ).toThrow('Unsupported multihash algorithm: 0x99')
  })

  it('rejects multihashes that are too short', () => {
    expect(() => decodeMultihash(new Uint8Array([0x12]))).toThrow('too short')
  })

  it('rejects a truncated algorithm varint', () => {
    expect(() => decodeMultihash(new Uint8Array([0xff, 0xff]))).toThrow(
      'Invalid varint'
    )
  })

  it('rejects a truncated length varint', () => {
    expect(() => decodeMultihash(new Uint8Array([0x12, 0xff]))).toThrow(
      'Invalid varint: buffer too short'
    )
  })

  it('rejects overlong (non-canonical) varint encodings', () => {
    // [0x92, 0x00] is a 2-byte encoding of 0x12; only [0x12] is canonical
    const overlong = new Uint8Array([0x92, 0x00, 0x20, ...sha256DigestBytes])
    expect(() => decodeMultihash(overlong)).toThrow(
      'Invalid varint: overlong encoding'
    )
  })

  it('rejects varints longer than the supported maximum', () => {
    const oversized = new Uint8Array([
      0x12, 0xff, 0xff, 0xff, 0xff, 0x7f, ...sha256DigestBytes
    ])
    expect(() => decodeMultihash(oversized)).toThrow(
      'Invalid varint: longer than 2 bytes'
    )
  })

  it('rejects truncated digests', () => {
    const multihash = createMultihash(
      sha256DigestBytes,
      MultihashAlgorithm.SHA2_256
    )
    expect(() => decodeMultihash(multihash.slice(0, 10))).toThrow(
      'digest too short'
    )
  })

  it('rejects trailing bytes after the digest', () => {
    const multihash = createMultihash(
      sha256DigestBytes,
      MultihashAlgorithm.SHA2_256
    )
    const withTrailing = new Uint8Array([...multihash, 0xde, 0xad])
    expect(() => decodeMultihash(withTrailing)).toThrow(
      'unexpected trailing bytes'
    )
  })

  it('rejects unsupported algorithms', () => {
    expect(() =>
      decodeMultihash(new Uint8Array([0x13, 0x02, 0xaa, 0xbb]))
    ).toThrow('Unsupported multihash algorithm: 0x13')
  })

  it('reports an unsupported algorithm even when the digest is truncated', () => {
    // sha2-512 (0x13) claiming 64 bytes but truncated: the algorithm error
    // must win over the length error
    const bytes = new Uint8Array([0x13, 0x40, ...new Uint8Array(10)])
    expect(() => decodeMultihash(bytes)).toThrow(
      'Unsupported multihash algorithm: 0x13'
    )
  })

  it('rejects digests whose length does not match the algorithm', () => {
    expect(() =>
      decodeMultihash(new Uint8Array([0x12, 0x02, 0xaa, 0xbb]))
    ).toThrow('Invalid digest length for algorithm 0x12: expected 32, got 2')
  })

  it('accepts a matching expected algorithm', () => {
    const multihash = createMultihash(
      sha256DigestBytes,
      MultihashAlgorithm.SHA2_256
    )
    expect(decodeMultihash(multihash, MultihashAlgorithm.SHA2_256)).toEqual({
      algorithm: MultihashAlgorithm.SHA2_256,
      digestLength: 32,
      digest: sha256DigestBytes
    })
  })

  it('rejects an algorithm other than the expected one', () => {
    const multihash = createMultihash(
      sha256DigestBytes,
      MultihashAlgorithm.SHA2_256
    )
    expect(() =>
      decodeMultihash(multihash, MultihashAlgorithm.SHA3_256)
    ).toThrow('Unexpected multihash algorithm: expected 0x16, got 0x12')
  })
})

describe('multikey', () => {
  function multikeyOf(prefix: number[], keyBytes: Uint8Array): string {
    return 'z' + base58.encode(new Uint8Array([...prefix, ...keyBytes]))
  }

  const keyBytes = new Uint8Array(32).map((_, index) => index + 1)
  const x25519Multikey = multikeyOf([0xec, 0x01], keyBytes)
  const ed25519Multikey = multikeyOf([0xed, 0x01], keyBytes)

  it('decodes an x25519 multikey', () => {
    expect(decodeMultikey({ multikey: x25519Multikey })).toEqual({
      codec: MultikeyCodec.X25519_PUB,
      keyBytes
    })
  })

  it('decodes an ed25519 multikey', () => {
    expect(decodeMultikey({ multikey: ed25519Multikey })).toEqual({
      codec: MultikeyCodec.ED25519_PUB,
      keyBytes
    })
  })

  it('accepts a matching expected codec', () => {
    expect(
      decodeMultikey({
        multikey: x25519Multikey,
        expectedCodec: MultikeyCodec.X25519_PUB
      })
    ).toEqual({ codec: MultikeyCodec.X25519_PUB, keyBytes })
  })

  it('rejects a codec other than the expected one', () => {
    expect(() =>
      decodeMultikey({
        multikey: ed25519Multikey,
        expectedCodec: MultikeyCodec.X25519_PUB
      })
    ).toThrow('Unexpected multikey codec: expected 0xec, got 0xed')
  })

  it('rejects a multikey without the base58btc "z" prefix', () => {
    expect(() => decodeMultikey({ multikey: x25519Multikey.slice(1) })).toThrow(
      'Invalid multikey: expected a base58btc "z" prefix'
    )
  })

  it('rejects a malformed base58btc payload', () => {
    expect(() => decodeMultikey({ multikey: 'z0OIl' })).toThrow(
      'Invalid multikey: malformed base58btc payload'
    )
  })

  it('rejects an unsupported codec', () => {
    // secp256k1-pub (0xe7) is a valid multicodec, but not supported here
    expect(() =>
      decodeMultikey({ multikey: multikeyOf([0xe7, 0x01], keyBytes) })
    ).toThrow('Unsupported multikey codec: 0xe7')
  })

  it('rejects trailing bytes after the key', () => {
    const tooLong = multikeyOf([0xec, 0x01], new Uint8Array(33))
    expect(() => decodeMultikey({ multikey: tooLong })).toThrow(
      'Invalid multikey: unexpected trailing bytes'
    )
  })

  it('rejects a key shorter than the codec requires', () => {
    const tooShort = multikeyOf([0xec, 0x01], new Uint8Array(31))
    expect(() => decodeMultikey({ multikey: tooShort })).toThrow(
      'Invalid key length for multikey codec 0xec: expected 32, got 31'
    )
  })

  // The multi-byte codecs encode as two-byte varints; the prefixes are pinned
  // here so a mirrored encode/decode bug cannot hide behind a shared helper.
  const codecVectors: Array<{
    name: string
    prefix: number[]
    codec: MultikeyCodec
    keyLength: number
  }> = [
    {
      name: 'ed25519-priv (32-byte seed)',
      prefix: [0x80, 0x26],
      codec: MultikeyCodec.ED25519_PRIV,
      keyLength: 32
    },
    {
      name: 'ed25519-priv (64-byte seed||pub)',
      prefix: [0x80, 0x26],
      codec: MultikeyCodec.ED25519_PRIV,
      keyLength: 64
    },
    {
      name: 'x25519-priv',
      prefix: [0x82, 0x26],
      codec: MultikeyCodec.X25519_PRIV,
      keyLength: 32
    },
    {
      name: 'p256-pub',
      prefix: [0x80, 0x24],
      codec: MultikeyCodec.P256_PUB,
      keyLength: 33
    },
    {
      name: 'p384-pub',
      prefix: [0x81, 0x24],
      codec: MultikeyCodec.P384_PUB,
      keyLength: 49
    },
    {
      name: 'p521-pub',
      prefix: [0x82, 0x24],
      codec: MultikeyCodec.P521_PUB,
      keyLength: 67
    },
    {
      name: 'p256-priv',
      prefix: [0x86, 0x26],
      codec: MultikeyCodec.P256_PRIV,
      keyLength: 32
    },
    {
      name: 'p384-priv',
      prefix: [0x87, 0x26],
      codec: MultikeyCodec.P384_PRIV,
      keyLength: 48
    },
    {
      name: 'p521-priv',
      prefix: [0x88, 0x26],
      codec: MultikeyCodec.P521_PRIV,
      keyLength: 66
    }
  ]

  for (const vector of codecVectors) {
    it(`decodes a ${vector.name} multikey`, () => {
      const bytes = new Uint8Array(vector.keyLength).map(
        (_, index) => (index + 1) % 256
      )
      expect(
        decodeMultikey({
          multikey: multikeyOf(vector.prefix, bytes),
          expectedCodec: vector.codec
        })
      ).toEqual({ codec: vector.codec, keyBytes: bytes })
    })
  }

  it('rejects an ed25519-priv key of neither allowed length', () => {
    const wrongLength = multikeyOf([0x80, 0x26], new Uint8Array(48))
    expect(() => decodeMultikey({ multikey: wrongLength })).toThrow(
      'Invalid key length for multikey codec 0x1300: expected 32 or 64, got 48'
    )
  })

  it('rejects a p256-pub key that is not a compressed SEC1 point', () => {
    const rawPoint = multikeyOf([0x80, 0x24], new Uint8Array(32))
    expect(() => decodeMultikey({ multikey: rawPoint })).toThrow(
      'Invalid key length for multikey codec 0x1200: expected 33, got 32'
    )
  })

  it('rejects a private-key codec where the public one is expected', () => {
    const ed25519PrivMultikey = multikeyOf([0x80, 0x26], new Uint8Array(32))
    expect(() =>
      decodeMultikey({
        multikey: ed25519PrivMultikey,
        expectedCodec: MultikeyCodec.ED25519_PUB
      })
    ).toThrow('Unexpected multikey codec: expected 0xed, got 0x1300')
  })
})
