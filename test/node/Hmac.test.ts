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
})
