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

If you're implementing the Verifiable Credential specification in Typescript,
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

### Versioning

The version numbers of this npm module are meant to mirror the version numbers
of the Verifiable Credentials Data Model specification. Developers are encouraged
to specify which VC Data model version they're using. For example, currently,
the VC DM 1.1 is the stable version:

```
"dependencies": {
   "@interop/data-integrity-core": "^1.1.0"
}
```

However, the VC DM 2.0 Working group is currently developing the second version
of the specification (which will likely make breaking changes). So, in the future:

```
"dependencies": {
   "@interop/data-integrity-core": "^3.0.0"
}
```

## Install

- Node.js 16+ is recommended.

### NPM

To install via NPM:

```
npm install @interop/data-integrity-core
```

### Development

To install locally (for development):

```
git clone https://github.com/interop-alliance/data-integrity-core.git
cd ssi
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
* `IKeyPair` and its children, such as `IVerificationKeyPair2020` and `IKeyAgreementKeyPair2020`
* `ISigner`
* ... others (see individual exports in `/src`)
* `IZcap` and related interfaces (`IRootZcap`, `IDelegatedZcap`, `IZcapLike`, and `ICapabilityDelegationProof`)

## Contribute

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

[MIT License](LICENSE.md) © 2026 Interop Alliance.
