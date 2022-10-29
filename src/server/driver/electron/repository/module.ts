import { Module, Global } from '@nestjs/common';
import { token as materialRepositoryToken } from 'service/repository/MaterialRepository';
import { token as fileRepositoryToken } from 'service/repository/FileRepository';
import { token as tagRepositoryToken } from 'service/repository/TagRepository';

import MaterialRepository from './MaterialRepository';
import FileRepository from './FileRepository';
import TagRepository from './TagRepository';

const repositories = [
  [materialRepositoryToken, MaterialRepository],
  [fileRepositoryToken, FileRepository],
  [tagRepositoryToken, TagRepository],
] as const;

@Global()
@Module({
  providers: repositories.map(([token, repositoryClass]) => ({ provide: token, useClass: repositoryClass })),
  exports: repositories.map(([token]) => token),
})
export default class RepositoryModule {}
