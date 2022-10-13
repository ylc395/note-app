import { Module } from '@nestjs/common';

import { MaterialsController } from './controller/MaterialsController';
import ElectronModule from './driver/electron/module';

@Module({
  controllers: [MaterialsController],
  imports: [ElectronModule],
})
export default class AppModule {}
