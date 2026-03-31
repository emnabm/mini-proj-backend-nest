import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSujetDto {
  @ApiProperty({ example: 'Question sur le module BD' })
  @IsString()
  @MinLength(5)
  titre: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
