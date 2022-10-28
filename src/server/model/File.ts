export interface File {
  id?: number;
  sourceUrl: string;
  mimeType: string;
  deviceName: string;
  hash: string;
  data: ArrayBuffer;
  isTemp: boolean;
}
