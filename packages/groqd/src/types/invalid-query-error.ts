/**
 * An error that is thrown when compiling a query.
 * This indicates that you've performed an invalid chain.
 */
export class InvalidQueryError extends Error {
  constructor(public key: string, message: string, private details?: any) {
    super(`[${key}] ${message}`);
  }
}
