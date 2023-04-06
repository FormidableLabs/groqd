export function addDeprecationMessage<Fn extends (...args: any[]) => any>(
  fn: Fn,
  message: string
): Fn {
  return <Fn>function (...args: any[]) {
    console.warn(message);
    return fn(...args);
  };
}
