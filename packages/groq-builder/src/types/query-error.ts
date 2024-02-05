/**
 * An error that is thrown when compiling a query.
 * This indicates that you've performed an invalid chain.
 */
export class QueryError extends Error {
  constructor(message: string, private details: any) {
    super(message);
  }
}
