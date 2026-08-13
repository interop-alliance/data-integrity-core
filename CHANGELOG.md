# @interop/data-integrity-core Changelog

## 8.5.0 - 2026-08-13

### Added

- `SHA256HMACKey.fromSecret({ id, secret })`: reconstruct the key from its raw
  secret bytes via a WebCrypto `raw`-format import, so consumers holding the
  unwrapped secret need no JWK round-trip (and a minimal `crypto.subtle` shim
  without JWK support suffices, e.g. on React Native's Hermes).

### Changed

- Docs: the `IInvocationTarget` JSDoc and test fixture use the
  `https://w3id.org/byoe#` descriptor IRIs instead of the retired `urn:was:`
  spellings.

## 8.4.0 - 2026-07-22
### Added
- Add `src/VPR.ts`: the Verifiable Presentation Request (VPR) type vocabulary
  (VC API messages exchanged with a wallet). Exports `IVPRequest`, `IVPOffer`,
  `IIssueRequest`, `IExchangeInvitation`, `IOid4VCIOffer`, `IVPRDetails`,
  `IVPRInteract`, `IVPRQuery` (the three-member spec union of `IQueryByExample`,
  `IDIDAuthenticationQuery`, and `IZcapQuery`), `ICredentialQuery`,
  `IAcceptedCryptosuites`, `ICapabilityQueryDetail`, `IInvocationTarget`,
  `IAllowedAction`, `WalletApiMessage`, and `WalletResponse` (whose optional
  `appConnect` field is inert for wallets that do not implement App Connect).
  Deprecated lower-case aliases are retained for existing importers:
  `IVpRequest`, `IVpOffer`, `IVprDetails`, `IVprQuery`, and
  `IDidAuthenticationQuery`. Available at the `./vpr` subpath. Types reuse the
  package's own `IZcap` / `IVerifiableCredential` / `IVerifiablePresentation`.
- Add `src/Guards.ts`: runtime shape guards and loose-shape normalizers over the
  VC / DID vocabulary. Guards: `isVerifiableCredential` and
  `isVerifiablePresentation` (inspect `type`), `isCredential`, `isDidDocument`,
  and `isVerificationKey` (inspect `@context` / `type`), all taking `unknown`
  input. Normalizers: `typeArray(type)`, `issuerId(issuer)`, and
  `subjectId(credential)`. Available at the `./guards` subpath.

## 8.3.0 - 2026-07-17
### Added
- Add DID resolution types (ported from `did-resolver`'s `resolver.ts`, with
  I-prefixed names and stricter typing): `IDIDResolutionOptions`,
  `IDIDResolutionMetadata`, `IDIDDocumentMetadata`, and `IDIDResolutionResult`.
  The result type uses this package's own `ILDContext` for `@context` and
  `IDIDDocument | null` for `didDocument`.
- Add `Extensible` (`Record<string, unknown>`): an object type that permits
  arbitrary additional properties, used by the resolution metadata and options
  types to admit spec-allowed extension properties. Undeclared property reads
  come back as `unknown`; DID method packages wanting typed extension
  properties should augment the interfaces via `declare module` instead.
- Add the shared DID resolution error vocabulary: `IDIDResolutionErrorCode`
  (the DID Resolution spec's registered codes -- `invalidDid`, `invalidDidUrl`,
  `invalidOptions`, `methodNotSupported`, `notFound`,
  `representationNotSupported`, `internalError` -- plus a `(string & {})` tail
  for method-specific codes), `IProblemDetails` (RFC 9457 `type`/`title`/
  `detail`), and a `problemDetails` field on `IDIDResolutionMetadata`.
- Add `DIDResolutionError`, an `Error` subclass carrying `code` and optional
  `problemDetails`, bridging the two resolution error channels: throw it from
  exception-based APIs (e.g. a DID method driver's `get()`), or call its
  `toResolutionResult()` to render the same failure as a spec resolution-result
  envelope.

## 8.2.0 - 2026-07-10
### Added
- Add optional `cursor` pagination field to `IEDVQuery`.

## 8.1.0 - 2026-06-14
### Added
- Add `SHA256HMACKey`: a reference, KMS-free implementation of the `IHMAC`
  contract (HMAC-SHA-256) used to blind EDV indexable attributes, backed by the
  global WebCrypto subtle API (isomorphic, no dependencies). Co-located with the
  `IHMAC` interface it satisfies. Serializes via JWK (`kty: 'oct'`) through
  `export({ secretKey })` / `from()`; its `type` is the protocol string
  `'Sha256HmacKey2019'`. Also exports the serialized-form type `ISHA256HMACKey`.

## 8.0.0 - 2026-06-12
### Added
- Add `IRecipientTemplate`: the pre-encryption JWE recipient input -- just a
  `header` carrying `kid`/`alg`, before key agreement fills in the rest.
  `IRecipient` now `extends IRecipientTemplate`, adding the wrapped
  `encrypted_key`. Build unencrypted recipient inputs with `IRecipientTemplate`
  and use `IRecipient` for recipients as they appear in a serialized JWE.

### Changed
- **BREAKING**: Tightened the JWE recipient types to match a serialized JWE.
  `IRecipientHeader.kid` and `IRecipientHeader.alg` are now required (were
  optional); `IRecipient.encrypted_key` is now required (was optional); and
  `IRecipient` no longer permits arbitrary extra properties (its index signature
  was removed). Code that typed pre-encryption recipient inputs as `IRecipient`
  should switch to the new `IRecipientTemplate`. `IRecipientHeader` still allows
  additional properties.

## 7.0.0 - 2026-06-09
### Changed
- **BREAKING**: `AbstractKeyPair.export()` is now `async` and returns
  `Promise<IKeyPair>` (was a synchronous `IKeyPair`). This lets suites whose key
  material requires asynchronous serialization (e.g. the WebCrypto-backed ECDSA
  suite, whose `subtle.exportKey` is async) override `export()` while extending
  `AbstractKeyPair`, rather than maintaining a parallel key-pair interface.
  Synchronous suites (e.g. Ed25519) may still implement `export()` synchronously,
  since callers `await` the result. Callers must now `await keyPair.export(...)`;
  the cryptographic signing/verification path is unaffected, as it goes through
  `signer()` / `verifier()` rather than `export()`.

## 6.4.0 - 2026-06-08
### Added
- Add `ILDContext` (in `./LD`): the JSON-LD `@context` value type,
  `string | Array<string | Record<string, unknown>>`.

### Changed
- Widen `IKeyPairCore['@context']` from `string | string[]` to `ILDContext` so a
  JSON-LD `@context` may include inline context objects (not just URL strings).
  This is a backwards-compatible widening; existing `string` / `string[]` values
  remain valid.
- Type `IProofDescription['@context']` (was `string | Array<string | object>`)
  and `IVerifiablePresentation['@context']` (was `any`) as `ILDContext`.

## 6.3.0 - 2026-06-08
### Added
- Add a `./Cipher` section with shared JOSE/JWE types and runtime contracts:
  `IJWE`, `IEPK`, `IRecipient`, `IRecipientHeader`, `IKeyResolver`,
  `IKeyAgreementKey` (the runtime key-agreement contract, a sibling of
  `ISigner` / `IVerifier`), and `IHMAC`.
- Add an `./EDV` section with the Encrypted Data Vault document and
  configuration model: `IEDVDocument`, `IEncryptedDocument`,
  `IEDVDocumentStream`, `IEDVChunk`, `IEDVConfig`, `IIndexEntry`,
  `IIndexAttribute`, and `IEDVQuery`.

### Changed
- Standardize type names on all-caps initialisms -- e.g. `IPublicJwk` to
  `IPublicJWK`, `IEcPublicJwk` to `IECPublicJWK`, `IRsaSecretJwk` to
  `IRSASecretJWK`, `IOkpPublicJwk` to `IOKPPublicJWK`, `IJsonWebPublicKey` to
  `IJSONWebPublicKey`, `IDidDocument` to `IDIDDocument`, and `ILdType` to
  `ILDType`. The previous PascalCase names remain exported as `@deprecated`
  aliases for backwards compatibility.

## 6.2.0 - 2026-06-07
### Added
- Add an optional `cryptosuite` field to `ICapabilityDelegationProof` (in the
  `./zcap` subpath). It is present when `type` is `'DataIntegrityProof'` (e.g.
  `cryptosuite: 'eddsa-jcs-2022'`) and absent for legacy suites such as
  `'Ed25519Signature2020'`.

## 6.1.2 - 2026-06-03
### Fixed
- Add a default export to `package.json`.

## 6.1.1 - 2026-06-02
### Fixed
- Re-export `Loader.js` (`IDocumentLoader`, `IRemoteDocument`) from the package
  root, so they are importable from `@interop/data-integrity-core` as the README
  documents (previously only reachable via the `/loader` subpath).

### Added
- Expose `./package.json` in the `exports` map so tooling can resolve it without
  reaching into `node_modules` directly.

## 6.1.0 - 2026-06-01
### Added
- Add `IProofDescription` interface (a Data Integrity proof, or the proof
  options used while creating one) listing the spec-defined proof terms.

### Changed
- Type the `proof` field of `IVerifiableCredential` and
  `IVerifiablePresentation` as `IProofDescription | IProofDescription[]`
  (was `any`).

## 6.0.2 - 2026-05-31
### Added
- Add `IJsonWebKeyDocument` and `IMultikeyDocument` interfaces.

## 6.0.1 - 2026-05-31
### Changed
- Update `generate()` function definition, include seed.

## 6.0.0 - 2026-05-31
### Changed
- **BREAKING**: Fork from `@digitalcredentials/ssi@5.5.0` to `@interop/data-integrity-core@6.0.0`.

### Added
- Add `KeyPair` abstract class export (brought over from `@digitalcredentials/keypair`).
- Add `IRemoteDocument` and `IDocumentLoader` interfaces (from `@interop/security-document-loader`).

## 5.5.0 - 2026-05-31
### Added
- Add exports of `IZcap` and related interfaces.

## 5.4.1-5.4.2 - 2025-11-05
### Changed
- Fix OBv3 `credentialSubject` - only one subject allowed.

## 5.4.0 - 2025-11-05
### Changed
- Modify `IAlignment` required fields to match LCW.

## 5.3.0 - 2025-10-15
### Added
- Add `IKeyAgreementKeyPair2020` export.

## 5.2.0 - 2025-10-15
### Added
- Add `identifier` property to `IOpenBadgeSubject` export.

## 5.1.0 - 2025-10-10
### Added
- Export `IOpenBadgeCredentialV3` interface.

## 5.0.0 - 2025-09-07
### Changed
- BREAKING: Separate out `ICompactJWT` exported type to be standalone (was
  making wallet code difficult.)
- Add validity period fields from VC DM 1.0 (`issuanceDate` and `expirationDate`)

## 4.0.0 - 2025-08-22
### Changed
- BREAKING: Fix `ISigner` interface, make signer.id mandatory (was optional before)
- Rename `IVerify` interface to `IVerifiablePayload`
- Rename `ISign` interface to `ISignablePayload`

## 3.0.1-3.0.5 - 2025-04-29
### Changed
- Fix `IJsonWebPublicKey` (ensure it extends `IKeyPairCore`)
- Add `algorithm` to `IVerifier` interface (to match multikey library).

## 3.0.0 - 2025-04-29
### Changed
- BREAKING: Rename repo to `ssi` from `vc-data-model`.

### Added
- Export `IDID` and `IDidDocument` interface.
- Export key and keypair interfaces (`IKeyPair`, `IPublicKey`, `ISigner`, `IVerifier`).

## 2.0.0 - 2024-xx-xx
### Added
- Implement VC Data Model v2.0

## 1.1.0 - 2022-12-12
### Added
- Initial commit. Meant to model VC Data Model v1.1
