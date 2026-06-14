import { describe, it, expect } from 'vitest'
import { SHA256HMACKey, type IHMAC } from '../../src/index.js'

describe('SHA256HMACKey', () => {
  it('satisfies the IHMAC contract', async () => {
    const hmac: IHMAC = await SHA256HMACKey.generate()
    expect(typeof hmac.sign).toBe('function')
    expect(typeof hmac.verify).toBe('function')
  })

  it('generates a key with an id, type, and algorithm', async () => {
    const hmac = await SHA256HMACKey.generate()
    expect(hmac.id).toMatch(/^urn:uuid:/)
    expect(hmac.type).toBe('Sha256HmacKey2019')
    expect(hmac.algorithm).toBe('HS256')
  })

  it('honors an explicit id', async () => {
    const hmac = await SHA256HMACKey.generate({ id: 'urn:example:hmac' })
    expect(hmac.id).toBe('urn:example:hmac')
  })

  it('signs and verifies', async () => {
    const hmac = await SHA256HMACKey.generate()
    const data = new TextEncoder().encode('blind me')
    const signature = await hmac.sign({ data })
    expect(signature).toBeInstanceOf(Uint8Array)
    expect(signature.length).toBe(32)
    expect(await hmac.verify({ data, signature })).toBe(true)

    const tampered = new TextEncoder().encode('blind you')
    expect(await hmac.verify({ data: tampered, signature })).toBe(false)
  })

  it('round-trips through export/from and produces stable signatures', async () => {
    const original = await SHA256HMACKey.generate()
    const data = new TextEncoder().encode('stable attribute')
    const expected = await original.sign({ data })

    const exported = await original.export({ secretKey: true })
    expect(exported.id).toBe(original.id)
    expect(exported.type).toBe('Sha256HmacKey2019')
    expect(exported.secretKeyJwk?.kty).toBe('oct')

    const restored = await SHA256HMACKey.from(exported)
    expect(restored.id).toBe(original.id)
    const again = await restored.sign({ data })
    expect([...again]).toEqual([...expected])
  })

  it('omits secret material from a public export', async () => {
    const hmac = await SHA256HMACKey.generate()
    const exported = await hmac.export()
    expect(exported.secretKeyJwk).toBeUndefined()
  })

  it('refuses to import without secret material', async () => {
    await expect(
      SHA256HMACKey.from({ id: 'urn:example:hmac', type: 'Sha256HmacKey2019' })
    ).rejects.toThrow(/secretKeyJwk/)
  })

  // HMAC-SHA-256 is deterministic: a fixed key over fixed data always yields
  // the same tag. These known-answer vectors are RFC 4231 (Identifiers and
  // Test Cases for HMAC-SHA-256), with the key material expressed as the
  // base64url-encoded `k` of an `oct` JWK.
  describe('RFC 4231 known-answer vectors', () => {
    const toHex = (bytes: Uint8Array) =>
      [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')

    const vectors = [
      {
        name: 'Test Case 1 (0x0b x20 key, "Hi There")',
        k: 'CwsLCwsLCwsLCwsLCwsLCwsLCws',
        data: 'Hi There',
        tag: 'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7'
      },
      {
        name: 'Test Case 2 ("Jefe" key, "what do ya want for nothing?")',
        k: 'SmVmZQ',
        data: 'what do ya want for nothing?',
        tag: '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'
      }
    ]

    for (const { name, k, data, tag } of vectors) {
      it(`reproduces ${name}`, async () => {
        const hmac = await SHA256HMACKey.from({
          id: 'urn:example:hmac',
          type: 'Sha256HmacKey2019',
          secretKeyJwk: { kty: 'oct', alg: 'HS256', k }
        })
        const signature = await hmac.sign({
          data: new TextEncoder().encode(data)
        })
        expect(toHex(signature)).toBe(tag)

        // verify() accepts the known-answer tag and rejects a tampered one.
        const knownTag = Uint8Array.from(
          tag.match(/../g)!.map(byte => parseInt(byte, 16))
        )
        expect(
          await hmac.verify({
            data: new TextEncoder().encode(data),
            signature: knownTag
          })
        ).toBe(true)
        const tampered = new TextEncoder().encode(`${data} `)
        expect(
          await hmac.verify({ data: tampered, signature: knownTag })
        ).toBe(false)
      })
    }
  })
})
