import { describe, it, expect } from 'vitest'
import {
  isVerifiableCredential,
  isVerifiablePresentation,
  isCredential,
  isDidDocument,
  isVerificationKey,
  typeArray,
  issuerId,
  subjectId,
  type IVerifiableCredential
} from '../../src/index.js'

describe('isVerifiableCredential', () => {
  it('accepts an object whose type array includes VerifiableCredential', () => {
    expect(
      isVerifiableCredential({ type: ['VerifiableCredential', 'FooCredential'] })
    ).toBe(true)
  })

  it('accepts a bare string type', () => {
    expect(isVerifiableCredential({ type: 'VerifiableCredential' })).toBe(true)
  })

  it('rejects a Verifiable Presentation', () => {
    expect(
      isVerifiablePresentation({ type: 'VerifiablePresentation' }) &&
        !isVerifiableCredential({ type: ['VerifiablePresentation'] })
    ).toBe(true)
    expect(isVerifiableCredential({ type: ['VerifiablePresentation'] })).toBe(
      false
    )
  })

  it('rejects objects with no type', () => {
    expect(isVerifiableCredential({})).toBe(false)
    expect(isVerifiableCredential({ type: 42 })).toBe(false)
  })

  it('rejects non-objects (widened unknown input)', () => {
    expect(isVerifiableCredential(null)).toBe(false)
    expect(isVerifiableCredential(undefined)).toBe(false)
    expect(isVerifiableCredential('VerifiableCredential')).toBe(false) // a bare string has no `.type` field
    expect(isVerifiableCredential(123)).toBe(false)
  })
})

describe('isVerifiablePresentation', () => {
  it('accepts an object whose type includes VerifiablePresentation', () => {
    expect(
      isVerifiablePresentation({ type: ['VerifiablePresentation'] })
    ).toBe(true)
    expect(isVerifiablePresentation({ type: 'VerifiablePresentation' })).toBe(
      true
    )
  })

  it('rejects a Verifiable Credential', () => {
    expect(
      isVerifiablePresentation({ type: ['VerifiableCredential'] })
    ).toBe(false)
  })

  it('rejects objects with no type', () => {
    expect(isVerifiablePresentation({})).toBe(false)
    expect(isVerifiablePresentation(null)).toBe(false)
  })
})

describe('isCredential (context-discriminating)', () => {
  it('accepts a VC 1.0 context', () => {
    expect(
      isCredential({ '@context': ['https://www.w3.org/2018/credentials/v1'] })
    ).toBe(true)
  })

  it('accepts a VC 2.0 context', () => {
    expect(
      isCredential({ '@context': ['https://www.w3.org/ns/credentials/v2'] })
    ).toBe(true)
  })

  it('accepts a string context (substring match)', () => {
    expect(
      isCredential({ '@context': 'https://www.w3.org/ns/credentials/v2' })
    ).toBe(true)
  })

  it('rejects a DID document context', () => {
    expect(
      isCredential({ '@context': ['https://www.w3.org/ns/did/v1'] })
    ).toBe(false)
  })

  it('rejects objects with no context', () => {
    expect(isCredential({})).toBe(false)
    expect(isCredential(null)).toBe(false)
  })
})

describe('isDidDocument', () => {
  it('accepts a DID v1 context', () => {
    expect(
      isDidDocument({ '@context': ['https://www.w3.org/ns/did/v1'] })
    ).toBe(true)
  })

  it('rejects a VC context', () => {
    expect(
      isDidDocument({ '@context': ['https://www.w3.org/2018/credentials/v1'] })
    ).toBe(false)
  })

  it('rejects objects with no context', () => {
    expect(isDidDocument({})).toBe(false)
    expect(isDidDocument(undefined)).toBe(false)
  })
})

describe('isVerificationKey', () => {
  it('accepts an Ed25519VerificationKey2020', () => {
    expect(isVerificationKey({ type: 'Ed25519VerificationKey2020' })).toBe(true)
  })

  it('rejects other key types and non-objects', () => {
    expect(isVerificationKey({ type: 'Ed25519VerificationKey2018' })).toBe(false)
    expect(isVerificationKey({})).toBe(false)
    expect(isVerificationKey(null)).toBe(false)
  })
})

describe('typeArray', () => {
  it('wraps a bare string in an array', () => {
    expect(typeArray('VerifiableCredential')).toEqual(['VerifiableCredential'])
  })

  it('returns an array unchanged, filtering out non-strings', () => {
    expect(typeArray(['VerifiableCredential', 'FooCredential'])).toEqual([
      'VerifiableCredential',
      'FooCredential'
    ])
    expect(typeArray(['a', 42, null, 'b'] as unknown)).toEqual(['a', 'b'])
  })

  it('returns an empty array for other shapes', () => {
    expect(typeArray(undefined)).toEqual([])
    expect(typeArray(null)).toEqual([])
    expect(typeArray(42)).toEqual([])
    expect(typeArray({})).toEqual([])
  })
})

describe('issuerId', () => {
  it('returns a bare string issuer', () => {
    expect(issuerId('did:example:123')).toBe('did:example:123')
  })

  it('reads the id from an issuer object', () => {
    expect(issuerId({ id: 'did:example:123', name: 'Acme' })).toBe(
      'did:example:123'
    )
  })

  it('returns undefined for an object with a non-string id', () => {
    expect(issuerId({ id: 42 })).toBeUndefined()
  })

  it('returns undefined for other shapes', () => {
    expect(issuerId(undefined)).toBeUndefined()
    expect(issuerId(null)).toBeUndefined()
    expect(issuerId({})).toBeUndefined()
    expect(issuerId(42)).toBeUndefined()
  })
})

describe('subjectId', () => {
  const base = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer'
  }

  it('returns the credentialSubject id when present', () => {
    const vc = {
      ...base,
      credentialSubject: { id: 'did:example:subject', name: 'Jo' }
    } as IVerifiableCredential
    expect(subjectId(vc)).toBe('did:example:subject')
  })

  it('returns undefined when the subject has no id', () => {
    const vc = {
      ...base,
      credentialSubject: { name: 'Jo' }
    } as IVerifiableCredential
    expect(subjectId(vc)).toBeUndefined()
  })

  it('returns undefined for an array subject (no top-level id)', () => {
    const vc = {
      ...base,
      credentialSubject: [{ id: 'did:example:subject' }]
    } as IVerifiableCredential
    expect(subjectId(vc)).toBeUndefined()
  })
})
