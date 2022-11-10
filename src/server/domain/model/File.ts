export interface File {
  id?: number;
  sourceUrl: string;
  mimeType: string;
  deviceName: string;
  hash: string;
  size: number;
  data: ArrayBuffer;
  isTemp: boolean;
}

export enum Events {
  Added = 'file.added',
}

export interface FileAddedEvent {
  fileId: number;
}
