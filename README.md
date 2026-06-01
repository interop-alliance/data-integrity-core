# Data Integrity and SSI Types _(@interop/data-integrity-core)_

[![Node.js CI](https://github.com/interop-alliance/data-integrity-core/workflows/CI/badge.svg)](https://github.com/interop-alliance/data-integrity-core/actions?query=workflow%3A%22CI%22)
[![NPM Version](https://img.shields.io/npm/v/@interop/data-integrity-core.svg)](https://npm.im/@interop/data-integrity-core)

> TypeScript types and definitions for the SSI ecosystem - cryptographic keys, DIDs, Verifiable Credentials, zCaps and related concepts.

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [License](#license)

## Background

If you're implementing the Verifiable Credential specification in TypeScript,
chances are that you're using a type definition for VerifiableCredentials
and VerifiablePresentations. Many VC-related projects (Sphereon's Veramo, 
LEF's LearnCard, Transmute's Verifiable Data) include the type definitions in
their monorepos.

We saw a niche for a standalone library that exported just the type definitions,
hence this repository.

See [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
specification.

Inspired by / incorporates elements of other VC Typescript libraries:

* https://github.com/Sphereon-Opensource/veramo (`/packages/core/src/types/vc-data-model.ts`)
* https://github.com/transmute-industries/verifiable-data (`/packages/vc.js/src/types/`)
* https://github.com/learningeconomy/LearnCard (`/packages/learn-card-core/src/types/`)
* Existing type definitions in DCC libraries (in `learner-credential-wallet` and others)

## Install

- Node.js 20+ is recommended.

### NPM

To install via NPM:

```
npm install @interop/data-integrity-core
```

### Development

To install locally (for development):

```
git clone https://github.com/interop-alliance/data-integrity-core.git
cd data-integrity-core
npm install
```

## Usage

```ts
import { IVerifiableCredential, IVerifiablePresentation } from '@interop/data-integrity-core'

// for example, in an Express route definition:
const vp = req.body.presentation as IVerifiablePresentation
```

### Exported Types/Interfaces

* `IVerifiableCredential` and `IVerifiablePresentation`
* `IOpenBadgeCredentialV3` (for OBv3 VCs)
* `IDidCoreDocument` and its children, `IDidDocument_v1_0` and `IDidDocument_v1_1`
* `IKeyPair` key description interface and its children, such as `IVerificationKeyPair2020` and `IKeyAgreementKeyPair2020`
* `AbstractKeyPair` abstract class (IKeyPair + signers, verifiers, and so on)
* `ISigner`
* `IDocumentLoader` and `IRemoteDocument`.
* `IZcap` and related interfaces (`IRootZcap`, `IDelegatedZcap`, `IZcapLike`, and `ICapabilityDelegationProof`)

## Contribute

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT License](LICENSE.md) © 2026 Interop Alliance.
