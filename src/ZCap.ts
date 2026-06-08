/*!
 * Authorization Capabilities (zCap) interfaces.
 * @see https://w3c-ccg.github.io/zcap-spec/
 */

/**
 * A proof attached to a delegated zCap.
 */
export interface ICapabilityDelegationProof {
  /** The cryptographic suite type (e.g. `'Ed25519Signature2020'`). */
  type: string
  /**
   * The Data Integrity cryptosuite (e.g. `'eddsa-jcs-2022'`). Present when
   * `type` is `'DataIntegrityProof'`; absent for legacy suites such as
   * `'Ed25519Signature2020'`.
   */
  cryptosuite?: string
  /** ISO 8601 date-time the proof was created. */
  created: string
  /** Verification method URI used to sign. */
  verificationMethod: string
  /** Always `'capabilityDelegation'`. */
  proofPurpose: 'capabilityDelegation'
  /**
   * Ordered capability chain (root → parent). All entries are string IDs
   * except the last delegated zCap, which is embedded as an object.
   */
  capabilityChain: Array<string | IDelegatedZcap>
  /** The encoded proof value. */
  proofValue: string
}

/**
 * A root authorization capability (zCap). Root zCaps are unsigned, have no
 * `expires` field and no delegation proof. Their `id` follows the convention
 * `urn:zcap:root:${encodeURIComponent(invocationTarget)}`.
 */
export interface IRootZcap {
  /** The zCap JSON-LD context URL. */
  '@context': string
  /** Capability ID (`urn:zcap:root:<encodedTarget>`). */
  id: string
  /** The DID(s) authorized to invoke. */
  controller: string | string[]
  /** Resource URI this capability grants access to (absolute URI). */
  invocationTarget: string
}

/**
 * A delegated authorization capability (zCap). Delegated capabilities narrow
 * a parent capability and must carry exactly one `capabilityDelegation` proof.
 */
export interface IDelegatedZcap {
  /** JSON-LD context array; first entry MUST be the zCap context URL. */
  '@context': string[]
  /** Capability ID (absolute URI). */
  id: string
  /** Parent capability ID (absolute URI). */
  parentCapability: string
  /** The DID(s) authorized to invoke. */
  controller: string | string[]
  /** Resource URI this capability grants access to (absolute URI). */
  invocationTarget: string
  /**
   * The action(s) the controller may perform; if absent, no actions are
   * allowed (except for the root zCap).
   */
  allowedAction?: string | string[]
  /** ISO 8601 date-time when this capability expires. */
  expires: string
  /** The capability delegation proof(s). */
  proof: ICapabilityDelegationProof | ICapabilityDelegationProof[]
}

/**
 * A zCap is either a root or a delegated authorization capability.
 *
 * Narrow with `'parentCapability' in cap` to discriminate between
 * `IRootZcap` and `IDelegatedZcap`.
 */
export type IZcap = IRootZcap | IDelegatedZcap
