import {Module} from '@nestjs/common';
import {AuthModule} from '../auth/auth.module';
import {MandatesController} from './mandates.controller';
import {MandatesService} from './mandates.service';
import {SpacesController} from './spaces.controller';
import {SpacesService} from './spaces.service';

@Module({
  imports: [AuthModule],
  controllers: [SpacesController, MandatesController],
  providers: [SpacesService, MandatesService],
})
export class SpacesModule {}
