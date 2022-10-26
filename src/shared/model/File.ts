export interface File {
  id: number;
  data?: ArrayBuffer;
  sourceUrl: string;
  hash: string;
  mimeType: string;
  deviceName: string;
}
