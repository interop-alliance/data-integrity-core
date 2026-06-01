import { describe, it, expect } from 'vitest'
import type {
  IVerifiableCredential,
  IVerifiablePresentation
} from '../../src/index.js'

describe('VerifiableCredential', () => {
  it('exists', () => {
    const vc: IVerifiableCredential = {
      '@context': ['http://example.com'],
      issuer: 'http://example.com',
      type: 'VerifiableCredential',
      credentialSubject: {}
    }

    expect(vc).toBeTruthy()
  })
})

describe('VerifiablePresentation', () => {
  it('exists', () => {
    const vp: IVerifiablePresentation = {
      '@context': ['http://example.com'],
      type: 'VerifiablePresentation'
    }
    expect(vp).toBeTruthy()
  })
})
