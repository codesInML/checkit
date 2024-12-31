import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';

type ResponseObject = {
  status_code: number;
  timestamp: string;
  path: string;
  response: string | object;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new LoggerService(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const responseObject: ResponseObject = {
      status_code: HttpStatus.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: 'Internal Server Error',
    };

    if (exception instanceof HttpException) {
      responseObject.status_code = exception.getStatus();
      responseObject.response = exception.getResponse();
    } else if (exception instanceof PrismaClientValidationError) {
      responseObject.status_code = 422;
      responseObject.response = exception.message.replaceAll(/\n/g, '');
    } else if (exception instanceof PrismaClientKnownRequestError) {
      responseObject.status_code = 400;
      responseObject.response = exception.message.replaceAll(/\n/g, '');
    }

    response.status(responseObject.status_code).json(responseObject);

    this.logger.error(
      typeof responseObject.response == 'string'
        ? responseObject.response
        : JSON.stringify(responseObject.response),
      AllExceptionsFilter.name,
    );

    super.catch(exception, host);
  }
}
