import {Controller, Get, UseGuards} from '@nestjs/common';
import {AuthService} from './auth.service';
import {HelperId} from './helper-id.decorator';
import {SessionAuthGuard} from './session-auth.guard';

@Controller()
export class MeController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(SessionAuthGuard)
  getCurrentHelper(@HelperId() helperId: string) {
    return this.authService.getCurrentHelper(helperId);
  }
}
