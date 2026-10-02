import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { DevicesModule } from './devices/devices.module';
import { EventsModule } from './events/events.module';
import { HealthModule } from './health/health.module';
import { PoliciesModule } from './policies/policies.module';
import { PrismaModule } from './prisma/prisma.module';
import { PushModule } from './push/push.module';
import { SpacesModule } from './spaces/spaces.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    HealthModule,
    SpacesModule,
    DevicesModule,
    PushModule,
    PoliciesModule,
    EventsModule,
  ],
})
export class AppModule {}
