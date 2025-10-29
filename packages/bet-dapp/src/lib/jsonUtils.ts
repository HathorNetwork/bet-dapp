/**
 * JSON utility functions for handling special types like BigInt
 */

/**
 * Custom JSON serializer that handles BigInt values
 * Converts BigInt to string to avoid serialization errors
 *
 * @param obj - The object to stringify
 * @param pretty - Whether to pretty-print with indentation (default: false)
 * @returns JSON string with BigInt values converted to strings
 */
export function jsonStringify(obj: any, pretty: boolean = false): string {
  return JSON.stringify(
    obj,
    (key, value) => typeof value === 'bigint' ? value.toString() : value,
    pretty ? 2 : undefined
  );
}

/**
 * Recursively converts BigInt values in an object to strings
 * This is useful when you need the actual object structure preserved
 * but with BigInt values converted for serialization safety
 *
 * @param obj - The object to convert
 * @returns New object with BigInt values converted to strings
 */
export function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }

  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }

  return obj;
}
