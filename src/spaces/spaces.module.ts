import {Module} from '@nestjs/common';
import {AuthModule} from '../auth/auth.module';
import {AdminSpacesController} from './admin-spaces.controller';
import {MandatesController} from './mandates.controller';
import {MandatesService} from './mandates.service';
import {SpacesController} from './spaces.controller';
import {SpacesService} from './spaces.service';

@Module({
  imports: [AuthModule],
  controllers: [SpacesController, AdminSpacesController, MandatesController],
  providers: [SpacesService, MandatesService],
  exports: [SpacesService],
})
export class SpacesModule {}
