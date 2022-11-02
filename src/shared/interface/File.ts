import { object, string, boolean, pattern, nonempty, optional, array, type Describe } from 'superstruct';

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
    sourceUrl: pattern(string(), /^file:\/\//),
    mimeType: nonempty(string()),
    isTemp: optional(boolean()),
  }),
);
