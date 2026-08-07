/*!
 * Verifiable Presentation Request (VPR) vocabulary.
 *
 * Type definitions for the VC API messages exchanged with a wallet -- offers of
 * credentials (`IVPOffer`), requests for credentials / DID Authentication
 * (`IVPRequest`), issuance requests (`IIssueRequest`), and exchange invitations
 * (`IExchangeInvitation`). These messages arrive over CHAPI, deep links, QR
 * codes, or exchange-URL POSTs; the shapes are transport agnostic.
 *
 * @see https://w3c-ccg.github.io/vp-request-spec/
 */
import type {
  IVerifiableCredential,
  IVerifiablePresentation
} from './VCDM.js'
import type { IZcap } from './ZCap.js'

/**
 * "I'm offering the following credentials" -- a Verifiable Presentation offered
 * to the wallet for storage.
 *
 * @see https://vcplayground.org/docs/n/chapi/wallets/native/#vc-api
 */
export type IVPOffer = {
  credentialRequestOrigin?: string
  verifiablePresentation: IVerifiablePresentation
  redirectUrl?: string
}

/**
 * "The following things are requested" -- a Verifiable Presentation Request
 * asking the wallet to share credentials and/or prove DID Authentication.
 *
 * @see https://w3c-ccg.github.io/vp-request-spec/
 */
export type IVPRequest = {
  credentialRequestOrigin?: string
  verifiablePresentationRequest: IVPRDetails
  redirectUrl?: string
}

/**
 * "Please store the following freshly-issued credential(s)" -- an issuance
 * message delivering one or more credentials to the wallet.
 */
export type IIssueRequest = {
  credentialRequestOrigin?: string
  issueRequest: {
    credential: IVerifiableCredential | IVerifiableCredential[]
  }
  redirectUrl: string
}

/**
 * A CHAPI exchange invitation: "A request or an offer is waiting for you over
 * at one of the named protocol endpoints." Each entry of `protocols` maps a
 * protocol name (e.g. `vcapi`, `OID4VCI`) to its exchange URL.
 *
 * @see https://vcplayground.org/docs/n/chapi/wallets/native/#verifiable-credential-storage
 */
export type IExchangeInvitation = {
  credentialRequestOrigin?: string
  /**
   * A mapping of protocol name to exchange URL, e.g.
   * `{ "vcapi": "https://exchanger.example.com/...", "OID4VCI": "openid-credential-offer://?..." }`.
   */
  protocols: Record<string, string>
}

/**
 * An OpenID for Verifiable Credential Issuance (OID4VCI) credential offer.
 *
 * @see https://vcplayground.org/docs/n/chapi/wallets/native/#oid4vci
 */
export type IOid4VCIOffer = {
  credential_issuer: string
  credentials: unknown[]
  grants: unknown
}

/**
 * The body of a Verifiable Presentation Request: one or more queries, plus the
 * `challenge` / `domain` used when a DID Authentication proof is requested, and
 * an optional `interact` block naming response-delivery endpoints. `query` is
 * optional: a CHAPI request that carries a `protocols` entry sends an empty VPR
 * body, deferring the real request to the named protocol exchange.
 */
export type IVPRDetails = {
  query?: IVPRQuery | IVPRQuery[]
  challenge?: string
  domain?: string
  interact?: IVPRInteract
}

/**
 * The interaction endpoints a VPR offers for delivering the response, when the
 * transport that carried the request is not itself the response channel.
 *
 * @see https://w3c-ccg.github.io/vp-request-spec/#interaction-types
 */
export type IVPRInteract = {
  service?: Array<{ type: string; serviceEndpoint?: string }>
}

/**
 * A single query within a Verifiable Presentation Request. The spec defines
 * three query types; wallet-specific extensions (e.g. App Connect) declare their
 * own widened union that adds members with distinct `type` strings.
 *
 * @see https://w3c-ccg.github.io/vp-request-spec/#query-types
 */
export type IVPRQuery =
  IQueryByExample | IDIDAuthenticationQuery | IZcapQuery

/**
 * The cryptosuites a verifier will accept for the response proof. VCALM types
 * each entry as an object, but verifiers in the wild (vcplayground.org among
 * them) send bare cryptosuite name strings; both forms are accepted.
 */
export type IAcceptedCryptosuites = Array<string | { cryptosuite: string }>

/**
 * A single credential query within a `QueryByExample`: an example credential
 * shape to match stored credentials against, plus an optional human-readable
 * `reason` to show the user. `acceptedCryptosuites` may be stated here rather
 * than on the enclosing query -- which is where vcplayground.org puts it.
 */
export type ICredentialQuery = {
  reason?: string
  acceptedCryptosuites?: IAcceptedCryptosuites
  example: {
    '@context'?: string | object | Array<string | object>
    type?: string | string[]
    issuer?: string | object | Array<string | object>
    [x: string]: unknown
  }
}

/**
 * A request for one or more VCs matching an example credential shape.
 * `credentialQuery` may be a single detail object or an array of them.
 *
 * @see https://w3c-ccg.github.io/vp-request-spec/#query-by-example
 */
export type IQueryByExample = {
  type: 'QueryByExample'
  acceptedCryptosuites?: IAcceptedCryptosuites
  credentialQuery: ICredentialQuery | ICredentialQuery[]
}

/**
 * A request for a proof of DID Authentication (a signed VerifiablePresentation
 * over the request's `challenge` / `domain`).
 *
 * @see https://w3c-ccg.github.io/vp-request-spec/#the-did-authentication-query-format
 */
export type IDIDAuthenticationQuery = {
  type: 'DIDAuthentication'
  acceptedMethods?: Array<{ method: string }>
  acceptedCryptosuites?: IAcceptedCryptosuites
}

/**
 * A wallet-defined descriptor naming a storage target for a capability request,
 * used when the `invocationTarget` is not a plain URL (e.g.
 * `https://w3id.org/byoe#collection` / `#public-collection` / `#space`).
 */
export type IInvocationTarget = {
  type?: string
  contentType?: string
  name?: string
  [x: string]: unknown
}

/** An action a capability grants; a plain action string or an action object. */
export type IAllowedAction = string | object

/**
 * A single requested capability: which actions (`allowedAction`) the RP
 * (`controller`) wants on which storage target (`invocationTarget`), with an
 * optional human-readable `reason` and RP-chosen `referenceId`. The
 * `invocationTarget` is either a plain URL (satisfied only under the user's own
 * Space) or a wallet-defined descriptor object.
 */
export type ICapabilityQueryDetail = {
  referenceId?: string
  reason?: string
  allowedAction?: IAllowedAction | IAllowedAction[]
  controller: string
  invocationTarget: string | IInvocationTarget
}

/**
 * A request for one or more delegated capabilities (zcaps) on the user's WAS
 * storage. `AuthorizationCapabilityQuery` is the canonical type string (VCALM
 * §3.4.4); `ZcapQuery` is a legacy alias sent by DCW / the
 * `wallet-to-webapp-demo`. `capabilityQuery` may be a single detail object or
 * an array of them.
 *
 * @see https://w3c.github.io/vcalm/ -- AuthorizationCapabilityQuery
 */
export type IZcapQuery = {
  type: 'AuthorizationCapabilityQuery' | 'ZcapQuery'
  capabilityQuery: ICapabilityQueryDetail | ICapabilityQueryDetail[]
  challenge?: string
}

/**
 * Any message the wallet accepts over its request/offer API: an exchange
 * invitation, a presentation request, a credential offer, or an issuance
 * request.
 */
export type WalletApiMessage =
  IExchangeInvitation | IVPRequest | IVPOffer | IIssueRequest

/**
 * The wallet's response to a request, delivered by whichever transport received
 * it (CHAPI `respondWith`, an exchange-URL POST, etc). Delegated zcaps ride
 * *inside* the response VP (as a `zcap` array, embedded before signing); they
 * are also threaded back out here as `zcaps` -- the same objects that were
 * delegated -- so a caller can record exactly what was granted without
 * re-parsing the VP. Empty or absent when the request granted no capabilities.
 * `appConnect`, when present, reports what an App Connect flow did (first run vs
 * returning, and the app-key subject DID the grants were delegated to). It is
 * inert for wallets that do not implement App Connect.
 */
export type WalletResponse = {
  verifiablePresentation?: IVerifiablePresentation
  zcaps?: IZcap[]
  appConnect?: { firstRun: boolean; subjectDid: string }
}

/**
 * @deprecated Use {@link IVPRequest} instead.
 */
export type IVpRequest = IVPRequest

/**
 * @deprecated Use {@link IVPOffer} instead.
 */
export type IVpOffer = IVPOffer

/**
 * @deprecated Use {@link IVPRDetails} instead.
 */
export type IVprDetails = IVPRDetails

/**
 * @deprecated Use {@link IVPRQuery} instead.
 */
export type IVprQuery = IVPRQuery

/**
 * @deprecated Use {@link IDIDAuthenticationQuery} instead.
 */
export type IDidAuthenticationQuery = IDIDAuthenticationQuery
