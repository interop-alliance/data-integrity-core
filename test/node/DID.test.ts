import { describe, it, expect } from 'vitest'
import {
  DIDResolutionError,
  VerificationMethodError,
  isDIDResolutionError,
  isVerificationMethodError
} from '../../src/index.js'

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

describe('isDIDResolutionError()', () => {
  it('accepts a local instance', () => {
    const error = new DIDResolutionError('x', { code: 'notFound' })
    expect(isDIDResolutionError(error)).toBe(true)
  })

  it('accepts an instance from another package copy or realm', () => {
    // Right name and code, but not `instanceof` the local class and not
    // `instanceof Error` either (as thrown across a realm boundary).
    const foreign = { name: 'DIDResolutionError', code: 'notFound' }
    expect(isDIDResolutionError(foreign)).toBe(true)
  })

  it('accepts a subclass that renames itself', () => {
    class NotFoundError extends DIDResolutionError {
      constructor() {
        super('x', { code: 'notFound' })
        this.name = 'NotFoundError'
      }
    }
    expect(isDIDResolutionError(new NotFoundError())).toBe(true)
  })

  it('rejects other values', () => {
    expect(isDIDResolutionError(new Error('x'))).toBe(false)
    expect(isDIDResolutionError({ name: 'DIDResolutionError' })).toBe(false)
    expect(
      isDIDResolutionError(
        new VerificationMethodError('x', { code: 'notFound' })
      )
    ).toBe(false)
    expect(isDIDResolutionError(null)).toBe(false)
    expect(isDIDResolutionError('DIDResolutionError')).toBe(false)
  })
})

describe('isVerificationMethodError()', () => {
  it('accepts a local instance', () => {
    const error = new VerificationMethodError('x', { code: 'notAuthorized' })
    expect(isVerificationMethodError(error)).toBe(true)
  })

  it('accepts an instance from another package copy or realm', () => {
    const foreign = { name: 'VerificationMethodError', code: 'invalidId' }
    expect(isVerificationMethodError(foreign)).toBe(true)
  })

  it('rejects other values', () => {
    expect(isVerificationMethodError(new Error('x'))).toBe(false)
    expect(
      isVerificationMethodError(
        new DIDResolutionError('x', { code: 'notFound' })
      )
    ).toBe(false)
    expect(isVerificationMethodError(undefined)).toBe(false)
  })
})
