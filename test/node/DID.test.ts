import { describe, it, expect } from 'vitest'
import { DIDResolutionError, VerificationMethodError } from '../../src/index.js'

describe('VerificationMethodError', () => {
  it('carries name, code, and the method id', () => {
    const error = new VerificationMethodError(
      'Verification method did:example:1#k not found.',
      { code: 'notFound', verificationMethod: 'did:example:1#k' }
    )
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('VerificationMethodError')
    expect(error.code).toBe('notFound')
    expect(error.verificationMethod).toBe('did:example:1#k')
    expect(error.message).toBe('Verification method did:example:1#k not found.')
  })

  it('takes the same constructor shape as DIDResolutionError', () => {
    const cause = new Error('inner')
    const error = new VerificationMethodError('x', {
      code: 'invalidId',
      cause
    })
    expect(error.cause).toBe(cause)
    expect(error.verificationMethod).toBeUndefined()
    const resolution = new DIDResolutionError('y', {
      code: 'notFound',
      cause
    })
    expect(resolution.cause).toBe(cause)
  })
})
