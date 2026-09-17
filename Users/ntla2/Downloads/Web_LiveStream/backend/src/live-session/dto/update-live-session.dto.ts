import { PartialType } from '@nestjs/mapped-types';
import { CreateLiveSessionDto } from './create-live-session.dto.js';

export class UpdateLiveSessionDto extends PartialType(CreateLiveSessionDto) {}
