import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Voici ma reponse...' })
  @IsString()
  @MinLength(1)
  contenu: string;
}
