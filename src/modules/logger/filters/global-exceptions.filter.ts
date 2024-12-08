import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Exception, SpanStatusCode, trace } from "@opentelemetry/api";

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private logger: Logger = new Logger(GlobalExceptionsFilter.name);
  constructor(private readonly httpAdapterHost: HttpAdapterHost) { }

  catch(exception: unknown, host: ArgumentsHost): void {
    // In certain situations `httpAdapter` might not be available in the
    // constructor method, thus we should resolve it here.
    const { httpAdapter } = this.httpAdapterHost;

    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = exception instanceof HttpException
      ? exception?.getResponse() : {
        statusCode: httpStatus,
        message: exception['message'],
      };

    const span = trace.getActiveSpan();

    // recordException converts the error into a span event. 
    span.recordException(exception as Exception);
    // Update the span status to failed.
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(exception) });

    this.logger.error(exception, exception['message']);

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}