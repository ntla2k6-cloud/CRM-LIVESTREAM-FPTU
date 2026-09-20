import { PartialType } from '@nestjs/mapped-types';
import { CreateGiftDto } from './create-gift.dto.js';

export class UpdateGiftDto extends PartialType(CreateGiftDto) {}
