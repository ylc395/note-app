export * from 'shard/model/file';

export interface File {
  name: string;
  mimeType: string;
  data: ArrayBuffer;
}
