export interface FileDTO {
  sourceUrl: string;
  mimeType: string;
  isTemp?: boolean;
}

export interface FileVO {
  id: number;
  sourceUrl: string;
  mimeType: string;
  deviceName: string;
  createdAt: number;
}

export type FileDataDTO = ArrayBuffer;
