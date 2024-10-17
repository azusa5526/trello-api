import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export function ApiObjectIdProperty() {
  return applyDecorators(
    ApiProperty({
      type: String,
      example: '670f5fa3fcc03a52ad410b63',
      description: 'MongoDB ObjectId',
    }),
  );
}
