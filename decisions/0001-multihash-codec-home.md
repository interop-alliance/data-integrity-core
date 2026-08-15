# 0001: Multihash byte codec home

- Status: accepted
- Date: 2026-08-15
- Driving work: homing the shared multihash byte codec that the
  hash-commitment verification methods (wallet-core decision 0001) need
- Affects: data-integrity-core (new `./multihash` subpath);
  did-method-webvh (`src/utils/multiformats.ts`, multihash half);
  wallet-core (`keyAgreementCommitment` and the roster resolver's
  commitment verification); http-digest-header (optional adoption)

## Context

The ecosystem needs a shared multihash byte codec: wallet-core's
`publicKeyCommitment` values are bare multihashes, did-method-webvh
already encodes and decodes multihashes internally, and http-digest-header
hand-rolls the same header bytes. The vendoring ban rules out copying the
routine into each consumer, so the codec needs one exported home low
enough in the stack that anything can import it.

## Decision

data-integrity-core exports the codec as a `./multihash` subpath:
`createMultihash(digest, algorithm)` wraps an already-computed digest,
`decodeMultihash` validates and splits one, and `MultihashAlgorithm`
names the supported set. It is a pure byte codec with no hashing
dependency (callers bring their own sha256), so the package stays
zero-dependency. The code is lifted from did-method-webvh's
`utils/multiformats.ts` together with its tests, and did-method-webvh
consumes the export; its `deriveHash` / `deriveNextKeyHash` outputs stay
byte-identical.

## Rejected Alternatives

- Export from did-method-webvh: it already holds the right primitive but
  sits too high in the stack; http-digest-header and other consumers
  would pull a whole DID method for a byte codec.
- A TypeScript fork of Digital Bazaar's minimal-digest: its one export
  (`digestMultibase`, with a documentLoader and urdca2015
  canonicalization, multibase base58btc default) is a document-digest API
  three layers above the byte codec needed here.
- Per-repo local copies: forbidden by the standing no-vendoring rule.

## Consequences

- data-integrity-core is confirmed as the ecosystem's zero-dependency
  bottom layer for this class of primitive; did-method-webvh and
  storage-core already depend on it.
- The multibase half of did-method-webvh's `utils/multiformats.ts` stays
  where it is for now (smaller blast radius; `@scure/base` covers plain
  base-encoding needs elsewhere).
- Publishes ripple in dependency order: data-integrity-core, then
  did-method-webvh, then wallet-core.

## Revisit Criteria

Reopen this decision when one or more of the following holds:

1. The multibase half also needs sharing outside did-method-webvh; it
   would join this subpath (or a sibling) here rather than gaining a
   second home.
2. A maintained, dependency-light upstream package covers the same byte
   codec; adopting it would replace this module behind the same subpath
   export.
