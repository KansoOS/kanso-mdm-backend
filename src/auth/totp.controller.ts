import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {TotpCodeDto} from './dto/totp-code.dto';
import {HelperId} from './helper-id.decorator';
import {JwtAuthGuard} from './jwt-auth.guard';
import {TotpService} from './totp.service';

@Controller('auth/totp')
@UseGuards(JwtAuthGuard)
export class TotpController {
  constructor(private readonly totpService: TotpService) {}

  @Post('setup')
  @HttpCode(HttpStatus.OK)
  setup(@HelperId() helperId: string) {
    return this.totpService.setup(helperId);
  }

  @Post('enable')
  @HttpCode(HttpStatus.OK)
  enable(@HelperId() helperId: string, @Body() dto: TotpCodeDto) {
    return this.totpService.enable(helperId, dto.code);
  }
}
