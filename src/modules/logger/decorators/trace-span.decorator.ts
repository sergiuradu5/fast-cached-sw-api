import { context, trace } from '@opentelemetry/api';

/**
 * A decorator to track OpenTelemetry spans for a method.
 * Automatically creates a span with the method name and associates it with a parent span (if available).
 * 
 * @param spanName Optional: A custom span name. Defaults to the method name.
 * @param attributes Optional: Custom attributes to add to the span.
 */
export function TraceSpan(spanName?: string, attributes?: Record<string, any>): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracer = trace.getTracer('sw-api');
      const spanNameToUse = spanName || propertyKey.toString();
      const span = tracer.startSpan(spanNameToUse, undefined, context.active());

      try {
        // Set custom attributes if provided
        if (attributes) {
          Object.entries(attributes).forEach(([key, value]) => {
            span.setAttribute(key, value);
          });
        }

        return await context.with(trace.setSpan(context.active(), span), async () => {
          return await originalMethod.apply(this, args);
        });
      } catch (error) {
        span.recordException(error);
        throw error;
      } finally {
        span.end();
      }
    };

    return descriptor;
  };
}
