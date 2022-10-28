import { Module, Global } from '@nestjs/common';
import { token as materialRepositoryToken } from 'service/repository/MaterialRepository';
import { token as fileRepositoryToken } from 'service/repository/FileRepository';

import MaterialRepository from './MaterialRepository';
import FileRepository from './FileRepository';

const repositories = [
  [materialRepositoryToken, MaterialRepository],
  [fileRepositoryToken, FileRepository],
] as const;

@Global()
@Module({
  providers: repositories.map(([token, repositoryClass]) => ({ provide: token, useClass: repositoryClass })),
  exports: repositories.map(([token]) => token),
})
export default class RepositoryModule {}
