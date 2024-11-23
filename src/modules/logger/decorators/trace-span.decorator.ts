import { context, trace } from '@opentelemetry/api';

/**
 * A decorator to track OpenTelemetry spans for a method.
 * Automatically creates a span with the method name and associates it with a parent span (if available).
 * 
 * @param spanName Optional: A custom span name. Defaults to the method name.
 */
export function TraceSpan(spanName?: string): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracer = trace.getTracer('nestjs-app'); // Replace 'nestjs-app' with your app's tracer name
      const spanNameToUse = spanName || propertyKey.toString();

      // Start a new span, linked to the current context (parent span if present)
      const span = tracer.startSpan(spanNameToUse, undefined, context.active());

      try {
        // Execute the original method within the span's context
        return await context.with(trace.setSpan(context.active(), span), async () => {
          return await originalMethod.apply(this, args);
        });
      } catch (error) {
        // Record any error in the span
        span.recordException(error);
        throw error;
      } finally {
        // Ensure the span is ended
        span.end();
      }
    };

    return descriptor;
  };
}
