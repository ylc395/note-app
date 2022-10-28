export interface MaterialDTO {
  name: string;
  comment: string;
  rating: number;
  fileId: number;
}

export type MaterialVO = MaterialDTO & {
  id: number;
  createdAt: number;
  updatedAt: number;
};
