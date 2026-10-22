import {IsString, Length} from 'class-validator';

// Intentionally the only field: ValidationPipe's forbidNonWhitelisted
// rejects anything else (name, diagnosis, ...) with a 400 at the boundary.
export class CreateSpaceDto {
  @IsString()
  @Length(1, 100)
  pseudonym: string;
}
