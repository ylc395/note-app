import { Module } from '@nestjs/common';
import { token as materialRepositoryToken } from 'service/repository/MaterialRepository';
import MaterialRepository from 'driver/sqlite/repository/MaterialRepository';

@Module({
  providers: [{ provide: materialRepositoryToken, useClass: MaterialRepository }],
  exports: [materialRepositoryToken],
})
export default class RepositoryModule {}
