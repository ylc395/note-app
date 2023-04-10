export interface File {
  name: string;
  mimeType: string;
  data: ArrayBuffer;
  sourceUrl?: string;
}
