import { PATH_METADATA } from '@nestjs/common/constants';
import { MessagePattern } from '@nestjs/microservices';

export function Post(path?: string) {
  return function (cls: any, properKey: string, descriptor: PropertyDescriptor) {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, cls);
    console.log(controllerPath);

    // if (!controllerPath) {
    //   throw new Error('Controller has no prefix.');
    // }
    const messagePattern = MessagePattern(`POST /${controllerPath}/${path}`);
    messagePattern(cls, properKey, descriptor);
  };
}
