import { PartialType } from '@nestjs/mapped-types';
import { CreateGainDto } from './create-gain.dto';

export class UpdateGainDto extends PartialType(CreateGainDto) {}
