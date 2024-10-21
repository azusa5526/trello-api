import { BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';

export function handleDatabaseOperationError(error: any, message = 'An unexpected error occurred') {
  if (error instanceof NotFoundException || error instanceof BadRequestException) {
    throw error;
  }
  console.error(`Error: ${error.message}`);
  throw new InternalServerErrorException(message);
}
