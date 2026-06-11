import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ example: 'uuid-mess-id', description: 'Mess ID' })
  @IsString()
  @IsNotEmpty()
  messId: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.ANNOUNCEMENT })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'Meal update for tomorrow' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Dinner will be served at 9 PM tomorrow.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: { mealId: 'uuid' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'uuid-user-id',
    description: 'Send browser push notification to one user only',
  })
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Send browser push notification to every active user',
  })
  @IsOptional()
  @IsBoolean()
  sendToAll?: boolean;
}

export class NotificationFilterDto {
  @ApiPropertyOptional({ description: 'Filter by mess ID' })
  @IsOptional()
  @IsString()
  messId?: string;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  @Transform(({ value }) => value?.toString())
  limit?: string;

  @ApiPropertyOptional({ example: 'created_at' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

class PushSubscriptionKeysDto {
  @ApiProperty({ example: 'base64-p256dh-key' })
  @IsString()
  @IsNotEmpty()
  p256dh: string;

  @ApiProperty({ example: 'base64-auth-key' })
  @IsString()
  @IsNotEmpty()
  auth: string;
}

export class SavePushSubscriptionDto {
  @ApiProperty({ example: 'https://fcm.googleapis.com/fcm/send/example' })
  @IsString()
  @IsNotEmpty()
  endpoint: string;

  @ApiProperty({ type: PushSubscriptionKeysDto })
  @ValidateNested()
  @Type(() => PushSubscriptionKeysDto)
  keys: PushSubscriptionKeysDto;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 ...' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class SendPushNotificationDto {
  @ApiProperty({ example: 'Payment reminder' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Please submit this month payment before Friday.' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ example: 'uuid-user-id' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ example: '/dashboard/payments' })
  @IsOptional()
  @IsString()
  url?: string;

  @ApiPropertyOptional({ example: { paymentId: 'uuid' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}
