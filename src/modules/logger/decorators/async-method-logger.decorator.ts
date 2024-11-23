import { Logger, LogLevel } from "@nestjs/common";
import { performance } from 'perf_hooks';

export function AsyncMethodLogger({ logLevel,
  logPerformance = true,
  logMethodArgs,
  logMethodRetunValue }: {
    logLevel?: LogLevel,
    logPerformance?: boolean,
    logMethodArgs?: boolean,
    logMethodRetunValue?: boolean
  } = { logLevel: 'verbose', logPerformance: true, logMethodArgs: false, logMethodRetunValue: false }) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const className = target.constructor.name;
    const logger: Logger = new Logger(className);
    // Original method that is being targeted and will be executed
    const original: (...args: Array<unknown>) => unknown = descriptor.value;

    const classMethodLabel: string = `${className}.${propertyKey}`;

    // Return a new method that wraps the original
    descriptor.value = async function (...args: Array<unknown>) {

      let stringifiedArgs: string | undefined = undefined;
      if (logMethodArgs) {
        stringifiedArgs = JSON.stringify(args);
      }

      logger[logLevel]({
        ...(logMethodArgs && { args: stringifiedArgs }),
        method: propertyKey,

      }, `Method called - ${classMethodLabel}`);
      // Execute the original method
      let responseTime: string | undefined = undefined;
      let returnValue: unknown;
      if (logPerformance) {

        const startTime = performance.now()
        returnValue = await original.apply(this, args);
        const endTime = performance.now()
        responseTime = (endTime - startTime).toFixed(2);
      } else {
        returnValue = await original.apply(this, args);
      }

      logger[logLevel]({
        ...(logMethodArgs && { args: stringifiedArgs }),
        ...(logMethodRetunValue && { returnValue: JSON.stringify(returnValue) }),
        ...(logPerformance && { performance: responseTime }),
        method: propertyKey,

      }, `Method finished - ${classMethodLabel}${logPerformance ? ` in ${responseTime}ms` : ''}`);

      return returnValue;
    };
  };
}