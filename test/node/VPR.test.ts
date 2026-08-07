import { describe, it, expect } from 'vitest'
import type {
  IVPRequest,
  IVpRequest,
  IVPOffer,
  IVpOffer,
  IIssueRequest,
  IExchangeInvitation,
  IOid4VCIOffer,
  IVPRDetails,
  IVprDetails,
  IVPRInteract,
  IVPRQuery,
  IVprQuery,
  IQueryByExample,
  ICredentialQuery,
  IAcceptedCryptosuites,
  IDIDAuthenticationQuery,
  IDidAuthenticationQuery,
  IZcapQuery,
  ICapabilityQueryDetail,
  IInvocationTarget,
  IAllowedAction,
  WalletApiMessage,
  WalletResponse,
  IVerifiableCredential,
  IVerifiablePresentation,
  IZcap
} from '../../src/index.js'

// This suite is primarily a compile-level check: it constructs a representative
// fixture for each exported VPR type (all type-only) and narrows the IVPRQuery
// union through its `type` discriminant. The runtime assertions merely give
// vitest something to execute so the file is type-checked in CI.

const vc: IVerifiableCredential = {
  '@context': ['https://www.w3.org/ns/credentials/v2'],
  type: ['VerifiableCredential'],
  issuer: 'did:example:issuer',
  credentialSubject: { id: 'did:example:subject' }
}

const vp: IVerifiablePresentation = {
  '@context': ['https://www.w3.org/ns/credentials/v2'],
  type: ['VerifiablePresentation'],
  verifiableCredential: [vc]
}

const zcap: IZcap = {
  '@context': 'https://w3id.org/zcap/v1',
  id: 'urn:zcap:root:https%3A%2F%2Fexample.com',
  controller: 'did:example:controller',
  invocationTarget: 'https://example.com/resource'
}

describe('VPR vocabulary (compile-level fixtures)', () => {
  it('constructs the accepted-cryptosuites forms (bare string + object)', () => {
    const accepted: IAcceptedCryptosuites = [
      'ecdsa-rdfc-2019',
      { cryptosuite: 'eddsa-rdfc-2022' }
    ]
    expect(accepted).toHaveLength(2)
  })

  it('constructs a QueryByExample with single and array credentialQuery', () => {
    const single: ICredentialQuery = {
      reason: 'We need your diploma',
      example: { type: ['UniversityDegreeCredential'] }
    }
    const query: IQueryByExample = {
      type: 'QueryByExample',
      acceptedCryptosuites: ['eddsa-rdfc-2022'],
      credentialQuery: [single, { example: { issuer: 'did:example:issuer' } }]
    }
    expect(query.type).toBe('QueryByExample')
  })

  it('constructs a DIDAuthentication query (canonical + deprecated alias)', () => {
    const q: IDIDAuthenticationQuery = {
      type: 'DIDAuthentication',
      acceptedMethods: [{ method: 'key' }],
      acceptedCryptosuites: [{ cryptosuite: 'eddsa-rdfc-2022' }]
    }
    const legacy: IDidAuthenticationQuery = q
    expect(legacy.type).toBe('DIDAuthentication')
  })

  it('constructs a ZcapQuery (both type strings) with invocation targets', () => {
    const target: IInvocationTarget = {
      type: 'https://w3id.org/byoe#collection',
      contentType: 'application/vc',
      name: 'credentials'
    }
    const action: IAllowedAction = 'read'
    const detail: ICapabilityQueryDetail = {
      referenceId: 'ref-1',
      reason: 'sync your credentials',
      allowedAction: [action, 'write'],
      controller: 'did:example:rp',
      invocationTarget: target
    }
    const canonical: IZcapQuery = {
      type: 'AuthorizationCapabilityQuery',
      capabilityQuery: detail,
      challenge: 'abc'
    }
    const legacy: IZcapQuery = {
      type: 'ZcapQuery',
      capabilityQuery: [detail]
    }
    expect(canonical.type).toBe('AuthorizationCapabilityQuery')
    expect(legacy.type).toBe('ZcapQuery')
  })

  it('narrows the IVPRQuery union through the type discriminant', () => {
    const queries: IVPRQuery[] = [
      { type: 'QueryByExample', credentialQuery: { example: {} } },
      { type: 'DIDAuthentication' },
      {
        type: 'ZcapQuery',
        capabilityQuery: {
          controller: 'did:example:rp',
          invocationTarget: 'https://example.com'
        }
      }
    ]
    const kinds = queries.map(q => {
      switch (q.type) {
        case 'QueryByExample':
          return q.credentialQuery ? 'byExample' : 'byExample'
        case 'DIDAuthentication':
          return 'didAuth'
        case 'AuthorizationCapabilityQuery':
        case 'ZcapQuery':
          return 'zcap'
      }
    })
    expect(kinds).toEqual(['byExample', 'didAuth', 'zcap'])

    // deprecated alias is assignable
    const alias: IVprQuery = queries[0]!
    expect(alias.type).toBe('QueryByExample')
  })

  it('constructs VPR details (query optional) with interact + aliases', () => {
    const interact: IVPRInteract = {
      service: [
        { type: 'UnmediatedPresentationService2021', serviceEndpoint: 'x' }
      ]
    }
    const details: IVPRDetails = {
      query: { type: 'DIDAuthentication' },
      challenge: 'nonce',
      domain: 'example.com',
      interact
    }
    const empty: IVPRDetails = {} // query is optional
    const alias: IVprDetails = details
    expect(empty.query).toBeUndefined()
    expect(alias.domain).toBe('example.com')
  })

  it('constructs the top-level messages and the WalletApiMessage union', () => {
    const request: IVPRequest = {
      credentialRequestOrigin: 'https://rp.example',
      verifiablePresentationRequest: { query: { type: 'DIDAuthentication' } }
    }
    const requestAlias: IVpRequest = request
    const offer: IVPOffer = { verifiablePresentation: vp }
    const offerAlias: IVpOffer = offer
    const issue: IIssueRequest = {
      issueRequest: { credential: vc },
      redirectUrl: 'https://rp.example/done'
    }
    const invitation: IExchangeInvitation = {
      protocols: { vcapi: 'https://exchanger.example/x' }
    }
    const oid4vci: IOid4VCIOffer = {
      credential_issuer: 'https://issuer.example',
      credentials: [],
      grants: {}
    }
    const messages: WalletApiMessage[] = [
      invitation,
      requestAlias,
      offerAlias,
      issue
    ]
    expect(messages).toHaveLength(4)
    expect(oid4vci.credential_issuer).toContain('issuer')
  })

  it('constructs a WalletResponse including the optional appConnect field', () => {
    const response: WalletResponse = {
      verifiablePresentation: vp,
      zcaps: [zcap],
      appConnect: { firstRun: true, subjectDid: 'did:example:app' }
    }
    const minimal: WalletResponse = {}
    expect(response.zcaps).toHaveLength(1)
    expect(minimal.verifiablePresentation).toBeUndefined()
  })
})
