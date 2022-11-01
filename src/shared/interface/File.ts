import { object, string, boolean, nonempty, optional, array, type Describe } from 'superstruct';

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
  isDuplicated?: boolean;
  createdAt?: number;
}

export type FileDataDTO = ArrayBuffer;

export const FileDTOSchema: Describe<FileDTO[]> = array(
  object({
    sourceUrl: nonempty(string()),
    mimeType: nonempty(string()),
    isTemp: optional(boolean()),
  }),
);
