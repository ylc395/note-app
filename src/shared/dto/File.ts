export interface FileDTO {
  sourceUrl: string;
  mimeType: string;
  isTemp: boolean;
}

export interface FileVO {
  id: number;
  sourceUrl: string;
  mimeType: string;
  deviceName: string;
  isDuplicated: boolean;
}

export type FileDataDTO = ArrayBuffer;
