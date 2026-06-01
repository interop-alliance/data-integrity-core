/**
 * A loaded remote document returned by a JSON-LD document loader.
 */
export interface IRemoteDocument {
  contextUrl?: string | null
  documentUrl?: string
  document: unknown
  tag?: string
}

/**
 * A JSON-LD document loader: resolves a URL to a remote document.
 */
export type IDocumentLoader = (url: string) => Promise<IRemoteDocument>
