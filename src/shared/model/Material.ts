export interface File {
  data: ArrayBuffer;
  name: string;
  sourceUrl: string;
  hash: string;
  mimeType: string;
  deviceName: string;
}

export interface MaterialWithoutFile {
  id: number;
  name: string;
  comment: string;
  rating: number;
  createdAt: number;
  updatedAt: number;
}

export type Material = MaterialWithoutFile & Pick<File, 'deviceName' | 'mimeType' | 'sourceUrl'>;
