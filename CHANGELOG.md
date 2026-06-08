# @interop/data-integrity-core Changelog

## Unreleased - TBD
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
