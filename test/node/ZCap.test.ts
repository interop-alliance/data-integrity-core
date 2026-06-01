import { describe, it, expect } from 'vitest'
import type {
  ICapabilityDelegationProof,
  IDelegatedZcap,
  IRootZcap,
  IZcap
} from '../../src/index.js'

describe('RootZcap', () => {
  it('exists', () => {
    const root: IRootZcap = {
      '@context': 'https://w3id.org/zcap/v1',
      id: 'urn:zcap:root:https%3A%2F%2Fexample.com%2Fresource',
      controller: 'did:example:alice',
      invocationTarget: 'https://example.com/resource'
    }

    expect(root).toBeTruthy()
  })
})

describe('DelegatedZcap', () => {
  it('exists', () => {
    const proof: ICapabilityDelegationProof = {
      type: 'Ed25519Signature2020',
      created: '2026-01-01T00:00:00Z',
      verificationMethod: 'did:example:alice#key-1',
      proofPurpose: 'capabilityDelegation',
      capabilityChain: ['urn:zcap:root:https%3A%2F%2Fexample.com%2Fresource'],
      proofValue: 'z3...'
    }

    const delegated: IDelegatedZcap = {
      '@context': ['https://w3id.org/zcap/v1'],
      id: 'urn:uuid:00000000-0000-0000-0000-000000000001',
      parentCapability: 'urn:zcap:root:https%3A%2F%2Fexample.com%2Fresource',
      controller: 'did:example:bob',
      invocationTarget: 'https://example.com/resource',
      allowedAction: ['GET'],
      expires: '2026-12-31T23:59:59Z',
      proof
    }

    expect(delegated).toBeTruthy()
  })
})

describe('IZcap union', () => {
  it('accepts root and delegated', () => {
    const root: IZcap = {
      '@context': 'https://w3id.org/zcap/v1',
      id: 'urn:zcap:root:https%3A%2F%2Fexample.com%2Fr',
      controller: 'did:example:alice',
      invocationTarget: 'https://example.com/r'
    }
    expect('parentCapability' in root).toBe(false)
  })
})
