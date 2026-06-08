/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 */

// General Linked Data 'type' term, aliased from '@type'
export type ILDType = string | string[]

/**
 * @deprecated Renamed to ILDType.
 */
export type ILdType = ILDType

// A JSON-LD `@context` value: a single URL, or an array of URLs and/or inline
// context objects.
export type ILDContext = string | Array<string | Record<string, unknown>>

// General purpose Image object, used in VCs etc
export interface IImageObject {
  id: string
  type?: ILDType
  [x: string]: any
}

export interface ILinkedDataObject {
  // id and type are very common to all Linked Data objects
  id?: string
  type?: ILDType

  name?: string
  description?: string
  image?: string | IImageObject
}
