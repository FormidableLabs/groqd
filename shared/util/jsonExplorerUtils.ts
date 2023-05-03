export const formatPrimitiveData = (data: unknown) => {
  if (typeof data === "string") return `\"${data}\"`;
  if (data instanceof Date) return `(Date) ${data}`;
  return String(data);
};
export const isObject = (data: unknown): data is Record<string, unknown> =>
  typeof data === "object" &&
  data !== null &&
  !Array.isArray(data) &&
  !(data instanceof Date);
export const addToPath = (existingPath: string, newSegment: string) =>
  existingPath ? `${existingPath}.${newSegment}` : newSegment;
