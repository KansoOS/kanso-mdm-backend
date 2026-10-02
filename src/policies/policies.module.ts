import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module';
import { PushModule } from '../push/push.module';
import { DevicePoliciesController } from './device-policies.controller';
import { PoliciesController } from './policies.controller';
import { PoliciesService } from './policies.service';

@Module({
  imports: [DevicesModule, PushModule],
  controllers: [PoliciesController, DevicePoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
