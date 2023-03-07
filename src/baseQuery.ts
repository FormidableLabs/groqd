import { z } from "zod";

export type Query = string;
export type Payload<T extends z.ZodTypeAny> = { schema: T; query: Query };

export class BaseQuery<T extends z.ZodTypeAny> {
  query: string;
  schema: T;

  constructor({ query, schema }: Payload<T>) {
    this.query = query;
    this.schema = schema;
  }

  public value(): Payload<T> {
    return { schema: this.schema, query: this.query };
  }

  nullable() {
    return new NullableBaseQuery({
      query: this.query,
      schema: this.schema.nullable(),
    });
  }
}

export class NullableBaseQuery<T extends z.ZodTypeAny> extends BaseQuery<
  z.ZodNullable<T>
> {
  constructor({ schema, query }: Payload<T>) {
    super({ schema: schema.nullable(), query });
  }
}
