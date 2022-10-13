import { Controller } from '@nestjs/common';
import { Post } from './decorators';

@Controller('materials')
export class MaterialsController {
  @Post()
  create(data: any) {
    console.log(data);
  }
}
